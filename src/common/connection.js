'use strict' // eslint-disable-line strict

const _ = require('lodash')
const {EventEmitter} = require('events')
var WebSocket
if(global.wx){
  WebSocket = require('./wswrapper')
}else{
  WebSocket = require('ws')
}
const parseURL = require('url').parse
const RangeSet = require('./rangeset').RangeSet
const {ChainsqldError, DisconnectedError, NotConnectedError,
  TimeoutError, ResponseFormatError, ConnectionError,
  ChainsqldNotInitializedError} = require('./errors')

function isStreamMessageType(type) {
  return type === 'ledgerClosed' ||
         type === 'transaction' ||
         type === 'path_find'
}

class Connection extends EventEmitter {
  constructor(url, options = {}) {
    super()
    this.setMaxListeners(Infinity)
    this._url = url
    this._trace = options.trace
    if (this._trace) {
      // for easier unit testing
      this._console = console
    }
    this._proxyURL = options.proxy
    this._proxyAuthorization = options.proxyAuthorization
    this._authorization = options.authorization
    this._trustedCertificates = options.trustedCertificates
    this._key = options.key
    this._passphrase = options.passphrase
    this._certificate = options.certificate
    this._timeout = options.timeout || (20 * 1000)
    this._isReady = false
    this._ws = null
    this._ledgerVersion = null
    this._availableLedgerVersions = new RangeSet()
    this._nextRequestID = 1
    this._retry = 0
    this._retryTimer = null
    this._onOpenErrorBound = null
    this._onUnexpectedCloseBound = null
    this._fee_base = null
    this._fee_ref = null
    this._schema_id = "";
    this._pingTimeout = 50000;
  }

  _updateLedgerVersions(data) {
    this._ledgerVersion = Number(data.ledger_index)
    if (data.validated_ledgers && data.validated_ledgers != 'empty') {
      this._availableLedgerVersions.reset()
      this._availableLedgerVersions.parseAndAddRanges(
        data.validated_ledgers)
    } else {
      this._availableLedgerVersions.addValue(this._ledgerVersion)
    }
  }

  _updateFees(data) {
    this._fee_base = Number(data.fee_base)
    this._fee_ref = Number(data.fee_ref)
  }

  // return value is array of arguments to Connection.emit
  _parseMessage(message) {
    const data = JSON.parse(message)
    if (data.type === 'response') {
      if (!(Number.isInteger(data.id) && data.id >= 0)) {
        throw new ResponseFormatError('valid id not found in response')
      }

      // update LedgerVersion When the chainsql's version is not to generate an empty block
      if(data.result && data.result.ledger_index && data.result.validated_ledgers){
        this._updateLedgerVersions(data.result);
      }

      return [data.id.toString(), data]
    } else if (isStreamMessageType(data.type)) {
      if (data.type === 'ledgerClosed') {
        this._updateLedgerVersions(data)
        this._updateFees(data)
      }
      return [data.type, data]
    } else if (data.type === undefined && data.error) {
      return ['error', data.error, data.error_message, data]  // e.g. slowDown
    }else if(data.type === 'table' || data.type === 'singleTransaction' || data.type === "contract_event"){
      return {};
    }
    throw new ResponseFormatError('unrecognized message type: ' + data.type)
  }

  _onMessage(message) {
    this._heartbeat();
    let parameters
    if (this._trace) {
      this._console.log(message)
    }
    try {
      parameters = this._parseMessage(message)
    } catch (error) {
      this.emit('error', 'badMessage', error.message, message)
      return
    }
    // we don't want this inside the try/catch or exceptions in listener
    // will be caught
    this.emit(...parameters)
  }

  get _state() {
    return this._ws ? this._ws.readyState : WebSocket.CLOSED
  }

  get _shouldBeConnected() {
    return this._ws !== null
  }

  isConnected() {
    return this._state === WebSocket.OPEN && this._isReady
  }

  _onUnexpectedClose(beforeOpen, resolve, reject, code) {
    if (this._onOpenErrorBound) {
      this._ws.removeListener('error', this._onOpenErrorBound)
      this._onOpenErrorBound = null
    }
    // just in case
    this._ws.removeAllListeners('open')
    clearTimeout(this._pingTimeoutFun);
    this._ws = null
    this._isReady = false
    if (beforeOpen) {
      // connection was closed before it was properly opened, so we must return
      // error to connect's caller
      this.connect().then(resolve, reject)
    } else {
      // if first parameter ws lib sends close code,
      // but sometimes it forgots about it, so default to 1006 - CLOSE_ABNORMAL
      this.emit('disconnected', code || 1006)
      this._retryConnect()
    }
  }

  _calculateTimeout(retriesCount) {
    return (retriesCount < 40)
      // First, for 2 seconds: 20 times per second
      ? (1000 / 20)
      : (retriesCount < 40 + 60)
        // Then, for 1 minute: once per second
        ? (1000)
        : (retriesCount < 40 + 60 + 60)
          // Then, for 10 minutes: once every 10 seconds
          ? (10 * 1000)
          // Then: once every 30 seconds
          : (30 * 1000)
  }

  _retryConnect() {
    this._retry += 1
    const retryTimeout = this._calculateTimeout(this._retry)
    this._retryTimer = setTimeout(() => {
      this.emit('reconnecting', this._retry)
      this.connect().catch(this._retryConnect.bind(this))
    }, retryTimeout)
  }

  _clearReconnectTimer() {
    clearTimeout(this._retryTimer)
    this._retryTimer = null
  }

  _onOpen() {
    if (!this._ws) {
      return Promise.reject(new DisconnectedError())
    }
    if (this._onOpenErrorBound) {
      this._ws.removeListener('error', this._onOpenErrorBound)
      this._onOpenErrorBound = null
    }

    return this.subscribe()
  }

  _rebindOnUnxpectedClose() {
    if (this._onUnexpectedCloseBound) {
      this._ws.removeListener('close', this._onUnexpectedCloseBound)
    }
    this._onUnexpectedCloseBound =
      this._onUnexpectedClose.bind(this, false, null, null)
    this._ws.once('close', this._onUnexpectedCloseBound)
  }

  _unbindOnUnxpectedClose() {
    if (this._onUnexpectedCloseBound) {
      this._ws.removeListener('close', this._onUnexpectedCloseBound)
    }
    this._onUnexpectedCloseBound = null
  }

  _onOpenError(reject, error) {
    this._onOpenErrorBound = null
    this._unbindOnUnxpectedClose()
    reject(new NotConnectedError(error && error.message))
  }

  _createWebSocket() {
    const options = {}
    // lujinglei:comment for wx small progress
    // if(!global.wx){
    //   if (this._proxyURL !== undefined) {
    //     const parsedURL = parseURL(this._url)
    //     const parsedProxyURL = parseURL(this._proxyURL)
    //     const proxyOverrides = _.omitBy({
    //       secureEndpoint: (parsedURL.protocol === 'wss:'),
    //       secureProxy: (parsedProxyURL.protocol === 'https:'),
    //       auth: this._proxyAuthorization,
    //       ca: this._trustedCertificates,
    //       key: this._key,
    //       passphrase: this._passphrase,
    //       cert: this._certificate
    //     }, _.isUndefined)
    //     const proxyOptions = _.assign({}, parsedProxyURL, proxyOverrides)
    //     let HttpsProxyAgent
    //     try {
    //       HttpsProxyAgent = require('https-proxy-agent')
    //     } catch (error) {
    //       throw new Error('"proxy" option is not supported in the browser')
    //     }
    //     options.agent = new HttpsProxyAgent(proxyOptions)
    //   }
    // }
    
    if (this._authorization !== undefined) {
      const base64 = Buffer.from(this._authorization).toString('base64')
      options.headers = {Authorization: `Basic ${base64}`}
    }
    const optionsOverrides = _.omitBy({
      ca: this._trustedCertificates,
      key: this._key,
      passphrase: this._passphrase,
      cert: this._certificate
    }, _.isUndefined)
    if(this._trustedCertificates !== undefined)
    {
      try {
        const cert = forgePki.certificateFromPem(this._trustedCertificates);
      } catch (error) {
        if(error.message.indexOf("OID is not RSA"))
        {
          optionsOverrides.secureProtocol = "TLSv1_2_method";
          optionsOverrides.ecdhCurve = "secp256k1";
        }
      }
    }
    const websocketOptions = _.assign({}, options, optionsOverrides)
    const websocket = new WebSocket(this._url, null, websocketOptions)
    // we will have a listener for each outstanding request,
    // so we have to raise the limit (the default is 10)
    if (typeof websocket.setMaxListeners === 'function') {
      websocket.setMaxListeners(Infinity)
    }
    return websocket
  }

  connect() {
    this._clearReconnectTimer()
    return new Promise((resolve, reject) => {
      if (!this._url) {
        reject(new ConnectionError(
          'Cannot connect because no server was specified'))
      }
      if (this._state === WebSocket.OPEN) {
        resolve()
      } else if (this._state === WebSocket.CONNECTING) {
        this._ws.once('open', resolve)
      } else {
        this._ws = this._createWebSocket()
        // when an error causes the connection to close, the close event
        // should still be emitted; the "ws" documentation says: "The close
        // event is also emitted when then underlying net.Socket closes the
        // connection (end or close)."
        // In case if there is connection error (say, server is not responding)
        // we must return this error to connection's caller. After successful
        // opening, we will forward all errors to main api object.
        this._onOpenErrorBound = this._onOpenError.bind(this, reject)
        this._ws.once('error', this._onOpenErrorBound)
        this._ws.on('message', this._onMessage.bind(this))
        this._ws.on('ping', this._heartbeat.bind(this));
        // in browser close event can came before open event, so we must
        // resolve connect's promise after reconnect in that case.
        // after open event we will rebound _onUnexpectedCloseBound
        // without resolve and reject functions
        this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(this, true,
          resolve, reject)
        this._ws.once('close', this._onUnexpectedCloseBound)
        this._ws.once('open', () => {
          const parsedURL = parseURL(this._url)
          // if ("127.0.0.1" === _this3._ws._socket.remoteAddress) {
          if ("127.0.0.1" === parsedURL.hostname || "localhost" === parsedURL.hostname) {
            this._pingTimeout = 5000;
          }
          this._onOpen().then(resolve, reject)})
      }
    })
  }

  schemaChanged(schemaid){
    this.unsubscribe()
    this._schema_id = schemaid
    return this.subscribe()
  }

  unsubscribe(){
    const request = {
      command: 'unsubscribe',
      streams: ['ledger']
    }
    return this.request(request).then(data => {
      return undefined
    })
  }

  subscribe(){
    const request = {
      command: 'subscribe',
      streams: ['ledger']
    }
    return this.request(request).then(data => {
      if (_.isEmpty(data) || !data.ledger_index) {
        // rippled instance doesn't have validated ledgers
        return this._disconnect(false).then(() => {
          throw new ChainsqldNotInitializedError('Chainsqld not initialized')
        })
      }

      this._updateLedgerVersions(data)
      this._updateFees(data)
      this._rebindOnUnxpectedClose()

      this._retry = 0
      this._ws.on('error', error => {
        if (process.browser && error && error.type === 'error') {
          // we are in browser, ignore error - `close` event will be fired
          // after error
          return
        }
        this.emit('error', 'websocket', error.message, error)
      })

      this._isReady = true
      this.emit('connected')

      return undefined
    })
  }

  disconnect() {
    return this._disconnect(true)
  }

  _disconnect(calledByUser) {
    if (calledByUser) {
      this._clearReconnectTimer()
      this._retry = 0
    }
    return new Promise(resolve => {
      if (this._state === WebSocket.CLOSED) {
        resolve()
      } else if (this._state === WebSocket.CLOSING) {
        this._ws.once('close', resolve)
      } else {
        if (this._onUnexpectedCloseBound) {
          this._ws.removeListener('close', this._onUnexpectedCloseBound)
          this._onUnexpectedCloseBound = null
        }
        this._ws.once('close', code => {
          this._ws = null
          this._isReady = false
          if (calledByUser) {
            this.emit('disconnected', code || 1000) // 1000 - CLOSE_NORMAL
          }
          resolve()
        })
        clearTimeout(this._pingTimeoutFun)
        this._ws.close()
      }
    })
  }

  reconnect() {
    return this.disconnect().then(() => this.connect())
  }

  _whenReady(promise) {
    return new Promise((resolve, reject) => {
      if (!this._shouldBeConnected) {
        reject(new NotConnectedError())
      } else if (this._state === WebSocket.OPEN && this._isReady) {
        promise.then(resolve, reject)
      } else {
        this.once('connected', () => promise.then(resolve, reject))
      }
    })
  }

  getLedgerVersion() {
    return this._whenReady(Promise.resolve(this._ledgerVersion))
  }

  hasLedgerVersions(lowLedgerVersion, highLedgerVersion) {
    return this._whenReady(Promise.resolve(
      this._availableLedgerVersions.containsRange(
        lowLedgerVersion, highLedgerVersion || this._ledgerVersion)))
  }

  hasLedgerVersion(ledgerVersion) {
    return this.hasLedgerVersions(ledgerVersion, ledgerVersion)
  }

  getFeeBase() {
    return this._whenReady(Promise.resolve(Number(this._fee_base)))
  }

  getFeeRef() {
    return this._whenReady(Promise.resolve(Number(this._fee_ref)))
  }

  _send(message) {
    if (this._trace) {
      this._console.log(message)
    }
    return new Promise((resolve, reject) => {
      this._ws.send(message, undefined, (error, result) => {
        if (error) {
          reject(new DisconnectedError(error.message))
        } else {
          resolve(result)
        }
      })
      this._heartbeat();
    })
  }

  request(request, timeout) {
    return new Promise((resolve, reject) => {
      if (!this._shouldBeConnected) {
        reject(new NotConnectedError())
      }

      let timer = null
      const self = this
      const id = this._nextRequestID
      const schema_id = this._schema_id;
      this._nextRequestID += 1
      const eventName = id.toString()

      function onDisconnect() {
        clearTimeout(timer)
        self.removeAllListeners(eventName)
        reject(new DisconnectedError())
      }

      function cleanup() {
        clearTimeout(timer)
        self.removeAllListeners(eventName)
        if (self._ws !== null) {
          self._ws.removeListener('close', onDisconnect)
        }
      }

      function _resolve(response) {
        cleanup()
        resolve(response)
      }

      function _reject(error) {
        cleanup()
        reject(error)
      }

      this.once(eventName, response => {
        if (response.status === 'error') {
          _reject(new ChainsqldError(response.error,response.error_message))
        } else if (response.status === 'success') {
          _resolve(response.result)
        } else {
          _reject(new ResponseFormatError(
            'unrecognized status: ' + response.status))
        }
      })

      this._ws.once('close', onDisconnect)

      // JSON.stringify automatically removes keys with value of 'undefined'
      const message = JSON.stringify(Object.assign({}, request, { id: id,schema_id:schema_id }))

      this._whenReady(this._send(message)).then(() => {
        const delay = timeout || this._timeout
        timer = setTimeout(() => _reject(new TimeoutError()), delay)
      }).catch(_reject)
    })
  }

  _heartbeat() {
    clearTimeout(this._pingTimeoutFun);

    this._pingTimeoutFun = setTimeout(() => {
      if (this._trace) {
        this._console.log("ping timeout, begin to terminate connection");
      }
      if(this._ws !== null ) {
        this._ws.terminate();
      }

      this.emit('disconnected', 1002);
      this._retryConnect();
    }, this._pingTimeout);
  }
}

module.exports = Connection
