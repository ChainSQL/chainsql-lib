/* @flow */
/* eslint-disable max-params */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const binary = require('dac-binary-codec')
const {computeTransactionHash} = require('dac-hashes')
const utils = require('./utils')
const parseTransaction = require('./parse/transaction')
const getTransaction = require('./transaction')
const {validate} = utils.common
import type {Connection} from '../common/connection.js'
import type {TransactionType} from './transaction-types'


type TransactionsOptions = {
  start?: string,
  limit?: number,
  minLedgerVersion?: number,
  maxLedgerVersion?: number,
  earliestFirst?: boolean,
  excludeFailures?: boolean,
  initiated?: boolean,
  counterparty?: string,
  types?: Array<string>,
  binary?: boolean,
  startTx?: TransactionType
}

type GetTransactionsResponse = Array<TransactionType>

function parseBinaryTransaction(transaction) {
  const tx = binary.decode(transaction.tx_blob)
  tx.hash = computeTransactionHash(tx)
  tx.ledger_index = transaction.ledger_index
  return {
    tx: tx,
    meta: binary.decode(transaction.meta),
    validated: transaction.validated
  }
}

function parseAccountTxTransaction(tx) {
  const _tx = tx.tx_blob ? parseBinaryTransaction(tx) : tx
  // rippled uses a different response format for 'account_tx' than 'tx'
  return parseTransaction(_.assign({}, _tx.tx,
    {meta: _tx.meta, validated: _tx.validated}))
}

function counterpartyFilter(filters, tx: TransactionType) {
  if (tx.address === filters.counterparty || (
    tx.specification && (
      (tx.specification.destination &&
        tx.specification.destination.address === filters.counterparty) ||
      (tx.specification.counterparty === filters.counterparty)
    ))) {
    return true
  }
  return false
}

function transactionFilter(address: string, filters: TransactionsOptions,
                           tx: TransactionType
) {
  if (filters.excludeFailures && tx.outcome.result !== 'tesSUCCESS') {
    return false
  }
  if (filters.types && !_.includes(filters.types, tx.type)) {
    return false
  }
  if (filters.initiated === true && tx.address !== address) {
    return false
  }
  if (filters.initiated === false && tx.address === address) {
    return false
  }
  if (filters.counterparty && !counterpartyFilter(filters, tx)) {
    return false
  }
  return true
}

function orderFilter(options: TransactionsOptions, tx: TransactionType) {
  return !options.startTx || (options.earliestFirst ?
    utils.compareTransactions(tx, options.startTx) > 0 :
    utils.compareTransactions(tx, options.startTx) < 0)
}

function formatPartialResponse(address: string,
  options: TransactionsOptions, data
) {
  return {
    marker: data.marker,
    results: data.transactions
      .filter(tx => tx.validated)
      .map(parseAccountTxTransaction)
      .filter(_.partial(transactionFilter, address, options))
      .filter(_.partial(orderFilter, options))
  }
}

function getAccountTx(connection: Connection, address: string,
  options: TransactionsOptions, marker: string, limit: number
) {
  const request = {
    command: 'account_tx',
    account: address,
    // -1 is equivalent to earliest available validated ledger
    ledger_index_min: options.minLedgerVersion || -1,
    // -1 is equivalent to most recent available validated ledger
    ledger_index_max: options.maxLedgerVersion || -1,
    forward: options.earliestFirst,
    binary: options.binary,
    limit: utils.clamp(limit, 10, 400),
    marker: marker
  }

  return connection.request(request).then(response =>
    formatPartialResponse(address, options, response))
}

function checkForLedgerGaps(connection: Connection,
  options: TransactionsOptions, transactions: GetTransactionsResponse
) {
  let {minLedgerVersion, maxLedgerVersion} = options

  // if we reached the limit on number of transactions, then we can shrink
  // the required ledger range to only guarantee that there are no gaps in
  // the range of ledgers spanned by those transactions
  if (options.limit && transactions.length === options.limit) {
    if (options.earliestFirst) {
      maxLedgerVersion = _.last(transactions).outcome.ledgerVersion
    } else {
      minLedgerVersion = _.last(transactions).outcome.ledgerVersion
    }
  }

  return utils.hasCompleteLedgerRange(connection, minLedgerVersion,
    maxLedgerVersion).then(hasCompleteLedgerRange => {
      if (!hasCompleteLedgerRange) {
        throw new utils.common.errors.MissingLedgerHistoryError()
      }
    })
}

function formatResponse(connection: Connection, options: TransactionsOptions,
                        transactions: GetTransactionsResponse
) {
  const compare = options.earliestFirst ? utils.compareTransactions :
    _.rearg(utils.compareTransactions, 1, 0)
  const sortedTransactions = transactions.sort(compare)
  return checkForLedgerGaps(connection, options, sortedTransactions).then(
    () => sortedTransactions)
}

function getTransactionsInternal(connection: Connection, address: string,
                                 options: TransactionsOptions
): Promise<GetTransactionsResponse> {
  const getter = _.partial(getAccountTx, connection, address, options)
  const format = _.partial(formatResponse, connection, options)
  return utils.getRecursive(getter, options.limit).then(format)
}

function getTransactions(address: string, options: TransactionsOptions = {}
): Promise<GetTransactionsResponse> {
  validate.getTransactions({address, options})

  const defaults = {maxLedgerVersion: -1}
  if (options.start) {
    return getTransaction.call(this, options.start).then(tx => {
      const ledgerVersion = tx.outcome.ledgerVersion
      const bound = options.earliestFirst ?
        {minLedgerVersion: ledgerVersion} : {maxLedgerVersion: ledgerVersion}
      const newOptions = _.assign({}, defaults, options, {startTx: tx}, bound)
      return getTransactionsInternal(this.connection, address, newOptions)
    })
  }
  const newOptions = _.assign({}, defaults, options)
  return getTransactionsInternal(this.connection, address, newOptions)
}

module.exports = getTransactions
