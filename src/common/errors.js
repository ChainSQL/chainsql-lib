'use strict' // eslint-disable-line strict
const util = require('util')
const browserHacks = require('./browser-hacks')

// this is needed because extending builtins doesn't work in babel 6.x
function extendableBuiltin(cls) {
  function ExtendableBuiltin() {
    cls.apply(this, arguments)
  }
  ExtendableBuiltin.prototype = Object.create(cls.prototype)
  browserHacks.setPrototypeOf(ExtendableBuiltin, cls)
  return ExtendableBuiltin
}

class DacError extends extendableBuiltin(Error) {
  constructor(message, data) {
    super(message)

    this.name = browserHacks.getConstructorName(this)
    this.message = message
    this.data = data
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor.name)
    }
  }

  toString() {
    let result = '[' + this.name + '(' + this.message
    if (this.data) {
      result += ', ' + util.inspect(this.data)
    }
    result += ')]'
    return result
  }

  /* console.log in node uses util.inspect on object, and util.inspect allows
  us to cutomize its output:
  https://nodejs.org/api/util.html#util_custom_inspect_function_on_objects */
  inspect() {
    return this.toString()
  }
}

class DacdError extends DacError {}

class UnexpectedError extends DacError {}

class LedgerVersionError extends DacError {}

class ConnectionError extends DacError {}

class NotConnectedError extends ConnectionError {}

class DisconnectedError extends ConnectionError {}

class DacdNotInitializedError extends ConnectionError {}

class TimeoutError extends ConnectionError {}

class ResponseFormatError extends ConnectionError {}

class ValidationError extends DacError {}

class NotFoundError extends DacError {
  constructor(message) {
    super(message || 'Not found')
  }
}

class MissingLedgerHistoryError extends DacError {
  constructor(message) {
    super(message || 'Server is missing ledger history in the specified range')
  }
}

class PendingLedgerVersionError extends DacError {
  constructor(message) {
    super(message || 'maxLedgerVersion is greater than server\'s'
      + ' most recent validated ledger')
  }
}

module.exports = {
  DacError,
  UnexpectedError,
  ConnectionError,
  DacdError,
  NotConnectedError,
  DisconnectedError,
  DacdNotInitializedError,
  TimeoutError,
  ResponseFormatError,
  ValidationError,
  NotFoundError,
  PendingLedgerVersionError,
  MissingLedgerHistoryError,
  LedgerVersionError
}
