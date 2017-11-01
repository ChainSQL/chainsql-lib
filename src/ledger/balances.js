/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const {validate} = utils.common
import type {Connection} from '../common/connection.js'
import type {TrustlinesOptions, Trustline} from './trustlines-types.js'


type Balance = {
  value: string,
  currency: string,
  counterparty?: string
}

type GetBalances = Array<Balance>

function getTrustlineBalanceAmount(trustline: Trustline) {
  return {
    currency: trustline.specification.currency,
    counterparty: trustline.specification.counterparty,
    value: trustline.state.balance
  }
}

function formatBalances(options, balances) {
  const result = balances.trustlines.map(getTrustlineBalanceAmount)
  if (!(options.counterparty ||
       (options.currency && options.currency !== 'ZXC')
  )) {
    const xrpBalance = {
      currency: 'ZXC',
      value: balances.xrp
    }
    result.unshift(xrpBalance)
  }
  if (options.limit && result.length > options.limit) {
    const toRemove = result.length - options.limit
    result.splice(-toRemove, toRemove)
  }
  return result
}

function getLedgerVersionHelper(connection: Connection, optionValue?: number
): Promise<number> {
  if (optionValue !== undefined && optionValue !== null) {
    return Promise.resolve(optionValue)
  }
  return connection.getLedgerVersion()
}

function getBalances(address: string, options: TrustlinesOptions = {}
): Promise<GetBalances> {
  validate.getTrustlines({address, options})

  return Promise.all([
    getLedgerVersionHelper(this.connection, options.ledgerVersion).then(
      ledgerVersion =>
        utils.getXRPBalance(this.connection, address, ledgerVersion)),
    this.getTrustlines(address, options)
  ]).then(results =>
    formatBalances(options, {xrp: results[0], trustlines: results[1]}))
}

module.exports = getBalances
