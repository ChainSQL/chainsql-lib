/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const common = require('../common')
const hashes = require('ripple-hashes')

function convertLedgerHeader(header) {
  return {
    account_hash: header.stateHash,
    close_time: common.iso8601ToRippleTime(header.closeTime),
    close_time_resolution: header.closeTimeResolution,
    close_flags: header.closeFlags,
    hash: header.ledgerHash,
    ledger_hash: header.ledgerHash,
    ledger_index: header.ledgerVersion.toString(),
    seqNum: header.ledgerVersion.toString(),
    parent_hash: header.parentLedgerHash,
    parent_close_time: common.iso8601ToRippleTime(header.parentCloseTime),
    total_coins: header.totalDrops,
    totalCoins: header.totalDrops,
    transaction_hash: header.transactionHash
  }
}

function hashLedgerHeader(ledgerHeader) {
  const header = convertLedgerHeader(ledgerHeader)
  return hashes.computeLedgerHash(header)
}

function computeTransactionHash(ledger, version) {
  if (ledger.rawTransactions === undefined) {
    return ledger.transactionHash
  }
  const transactions = JSON.parse(ledger.rawTransactions)
  const txs = _.map(transactions, tx => {
    const mergeTx = _.assign({}, _.omit(tx, 'tx'), tx.tx || {})
    const renameMeta = _.assign({}, _.omit(mergeTx, 'meta'),
      tx.meta ? {metaData: tx.meta} : {})
    return renameMeta
  })
  const transactionHash = hashes.computeTransactionTreeHash(txs, version)
  if (ledger.transactionHash !== undefined
      && ledger.transactionHash !== transactionHash) {
    throw new common.errors.ValidationError('transactionHash in header'
      + ' does not match computed hash of transactions')
  }
  return transactionHash
}

function computeStateHash(ledger, version) {
  if (ledger.rawState === undefined) {
    return ledger.stateHash
  }
  const state = JSON.parse(ledger.rawState)
  const stateHash = hashes.computeStateTreeHash(state, version)
  if (ledger.stateHash !== undefined && ledger.stateHash !== stateHash) {
    throw new common.errors.ValidationError('stateHash in header'
      + ' does not match computed hash of state')
  }
  return stateHash
}

const sLCF_SHAMapV2 = 0x02

function computeLedgerHash(ledger: Object): string {
  const version = ((ledger.closeFlags & sLCF_SHAMapV2) === 0) ? 1 : 2
  const subhashes = {
    transactionHash: computeTransactionHash(ledger, version),
    stateHash: computeStateHash(ledger, version)
  }
  return hashLedgerHeader(_.assign({}, ledger, subhashes))
}

module.exports = computeLedgerHash
