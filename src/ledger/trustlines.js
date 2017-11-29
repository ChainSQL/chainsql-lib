/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const {validate} = utils.common
const parseAccountTrustline = require('./parse/account-trustline')
import type {Connection} from '../common/connection.js'
import type {TrustlinesOptions, Trustline} from './trustlines-types.js'


type GetTrustlinesResponse = Array<Trustline>

function currencyFilter(currency: string, trustline: Trustline) {
  return currency === null || trustline.specification.currency === currency
}

function formatResponse(options: TrustlinesOptions, data) {
  return {
    marker: data.marker,
    results: data.lines.map(parseAccountTrustline)
      .filter(_.partial(currencyFilter, options.currency || null))
  }
}

function getAccountLines(connection: Connection, address: string,
  ledgerVersion: number, options: TrustlinesOptions, marker: string,
  limit: number
): Promise<GetTrustlinesResponse> {
  const request = {
    command: 'account_lines',
    account: address,
    ledger_index: ledgerVersion,
    marker: marker,
    limit: utils.clamp(limit, 10, 400),
    peer: options.counterparty
  }

  return connection.request(request).then(_.partial(formatResponse, options))
}

function getTrustlines(address: string, options: TrustlinesOptions = {}
): Promise<GetTrustlinesResponse> {
  validate.getTrustlines({address, options})

  return this.getLedgerVersion().then(ledgerVersion => {
    const getter = _.partial(getAccountLines, this.connection, address,
      options.ledgerVersion || ledgerVersion, options)
    return utils.getRecursive(getter, options.limit)
  })
}

module.exports = getTrustlines
