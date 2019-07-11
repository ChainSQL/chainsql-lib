'use strict' // eslint-disable-line strict
const _ = require('lodash')
const {convertKeysFromSnakeCaseToCamelCase} = require('./utils')
import type {Connection} from './connection'

export type GetServerInfoResponse = {
  buildVersion: string,
  completeLedgers: string,
  hostID: string,
  ioLatencyMs: number,
  load?: {
    jobTypes: Array<Object>,
    threads: number
  },
  lastClose: {
    convergeTimeS: number,
    proposers: number
  },
  loadFactor: number,
  peers: number,
  pubkeyNode: string,
  pubkeyValidator?: string,
  serverState: string,
  validatedLedger: {
    age: number,
    baseFeeZXC: string,
    hash: string,
    reserveBaseZXC: string,
    reserveIncrementZXC: string,
    ledgerVersion: number
  },
  validationQuorum: number
}

function renameKeys(object, mapping) {
  _.forEach(mapping, (to, from) => {
    object[to] = object[from]
    delete object[from]
  })
}

function getServerInfo(connection: Connection): Promise<GetServerInfoResponse> {
  return connection.request({command: 'server_info'}).then(response => {
    const info = convertKeysFromSnakeCaseToCamelCase(response.info)
    renameKeys(info, {hostid: 'hostID'})
    if (info.validatedLedger) {
      renameKeys(info.validatedLedger, {
        baseFeeZxc: 'baseFeeZXC',
        reserveBaseZxc: 'reserveBaseZXC',
        reserveIncZxc: 'reserveIncrementZXC',
        seq: 'ledgerVersion'
      })
      info.validatedLedger.baseFeeZXC =
        info.validatedLedger.baseFeeZXC.toString()
      info.validatedLedger.reserveBaseZXC =
        info.validatedLedger.reserveBaseZXC.toString()
      info.validatedLedger.reserveIncrementZXC =
        info.validatedLedger.reserveIncrementZXC.toString()

      if(info.validatedLedger.dropsPerByte != undefined){
          info.validatedLedger.dropsPerByte =
          info.validatedLedger.dropsPerByte.toString()
      }

   
    }
    return info
  })
}

function computeFeeFromServerInfo(cushion: number,
    serverInfo: GetServerInfoResponse
): number {
  return (Number(serverInfo.validatedLedger.baseFeeZXC)
       * Number(serverInfo.loadFactor) * cushion).toString()
}

function getFee(connection: Connection, cushion: number) {
  return getServerInfo(connection).then(
    _.partial(computeFeeFromServerInfo, cushion))
}

module.exports = {
  getServerInfo,
  getFee
}
