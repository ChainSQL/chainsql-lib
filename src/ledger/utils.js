/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const assert = require('assert')
const common = require('../common')
const dropsToXrp = common.dropsToXrp
import type {TransactionType} from './transaction-types'
import type {Issue} from '../common/types.js'
import type {Connection} from '../common/connection'

type RecursiveData = {
  marker: string,
  results: Array<any>
}

type Getter = (marker: ?string, limit: number) => Promise<RecursiveData>

function clamp(value: number, min: number, max: number): number {
  assert(min <= max, 'Illegal clamp bounds')
  return Math.min(Math.max(value, min), max)
}

function getXRPBalance(connection: Connection, address: string,
  ledgerVersion?: number
): Promise<number> {
  const request = {
    command: 'account_info',
    account: address,
    ledger_index: ledgerVersion
  }
  return connection.request(request).then(data =>
    dropsToXrp(data.account_data.Balance))
}

// If the marker is omitted from a response, you have reached the end
function getRecursiveRecur(getter: Getter, marker?: string, limit: number
): Promise {
  return getter(marker, limit).then(data => {
    const remaining = limit - data.results.length
    if (remaining > 0 && data.marker !== undefined) {
      return getRecursiveRecur(getter, data.marker, remaining).then(results =>
        data.results.concat(results)
      )
    }
    return data.results.slice(0, limit)
  })
}

function getRecursive(getter: Getter, limit?: number): Promise {
  return getRecursiveRecur(getter, undefined, limit || Infinity)
}

function renameCounterpartyToIssuer(amount?: Issue): ?{issuer?: string} {
  if (amount === undefined) {
    return undefined
  }
  const issuer = amount.counterparty === undefined ?
    (amount.issuer !== undefined ? amount.issuer : undefined) :
    amount.counterparty
  const withIssuer = _.assign({}, amount, {issuer: issuer})
  return _.omit(withIssuer, 'counterparty')
}

type RequestBookOffersArgs = {taker_gets: Issue, taker_pays: Issue}

function renameCounterpartyToIssuerInOrder(order: RequestBookOffersArgs) {
  const taker_gets = renameCounterpartyToIssuer(order.taker_gets)
  const taker_pays = renameCounterpartyToIssuer(order.taker_pays)
  const changes = {taker_gets: taker_gets, taker_pays: taker_pays}
  return _.assign({}, order, _.omitBy(changes, _.isUndefined))
}

function signum(num) {
  return (num === 0) ? 0 : (num > 0 ? 1 : -1)
}

/**
 *  Order two rippled transactions based on their ledger_index.
 *  If two transactions took place in the same ledger, sort
 *  them based on TransactionIndex
 *  See: https://ripple.com/build/transactions/
 *
 *  @param {Object} first
 *  @param {Object} second
 *  @returns {Number} [-1, 0, 1]
 */

function compareTransactions(first: TransactionType, second: TransactionType
): number {
  if (!first.outcome || !second.outcome) {
    return 0
  }
  if (first.outcome.ledgerVersion === second.outcome.ledgerVersion) {
    return signum(first.outcome.indexInLedger - second.outcome.indexInLedger)
  }
  return first.outcome.ledgerVersion < second.outcome.ledgerVersion ? -1 : 1
}

function hasCompleteLedgerRange(connection: Connection,
  minLedgerVersion?: number, maxLedgerVersion?: number
): Promise<boolean> {
  const firstLedgerVersion = 32570 // earlier versions have been lost
  return connection.hasLedgerVersions(
    minLedgerVersion || firstLedgerVersion, maxLedgerVersion)
}

function isPendingLedgerVersion(connection: Connection,
  maxLedgerVersion: ?number
): Promise<boolean> {
  return connection.getLedgerVersion().then(ledgerVersion =>
    ledgerVersion < (maxLedgerVersion || 0))
}

function ensureLedgerVersion(options: Object
): Promise<number> {
  if (Boolean(options) && options.ledgerVersion !== undefined &&
    options.ledgerVersion !== null
  ) {
    return Promise.resolve(options)
  }
  return this.getLedgerVersion().then(ledgerVersion =>
    _.assign({}, options, {ledgerVersion}))
}

module.exports = {
  getXRPBalance,
  ensureLedgerVersion,
  compareTransactions,
  renameCounterpartyToIssuerInOrder,
  getRecursive,
  hasCompleteLedgerRange,
  isPendingLedgerVersion,
  clamp: clamp,
  common: common
}
