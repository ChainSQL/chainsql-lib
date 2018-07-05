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
    baseFeeDac: string,
    hash: string,
    reserveBaseDac: string,
    reserveIncrementDac: string,
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
        reserveIncDac: 'reserveIncrementDac',
        seq: 'ledgerVersion'
      })
      info.validatedLedger.baseFeeDac =
        info.validatedLedger.baseFeeDac.toString()
      info.validatedLedger.reserveBaseDac =
        info.validatedLedger.reserveBaseDac.toString()
      info.validatedLedger.reserveIncrementDac =
        info.validatedLedger.reserveIncrementDac.toString()
    }
    return info
  })
}

function computeFeeFromServerInfo(cushion: number,
    serverInfo: GetServerInfoResponse
): number {
  return (Number(serverInfo.validatedLedger.baseFeeDac)
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
