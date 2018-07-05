/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const transactionParser = require('dac-lib-transactionparser')
const utils = require('../utils')
const BigNumber = require('bignumber.js')
const parseAmount = require('./amount')

import type {Amount} from '../common/types.js'

function adjustQualityForDAC(
  quality: string, takerGetsCurrency: string, takerPaysCurrency: string
) {
  // quality = takerPays.value/takerGets.value
  // using drops (1e-6 DAC) for DAC values
  const numeratorShift = (takerPaysCurrency === 'DAC' ? -6 : 0)
  const denominatorShift = (takerGetsCurrency === 'DAC' ? -6 : 0)
  const shift = numeratorShift - denominatorShift
  return shift === 0 ? quality :
    (new BigNumber(quality)).shift(shift).toString()
}

function parseQuality(quality: ?number) {
  if (typeof quality === 'number') {
    return (new BigNumber(quality)).shift(-9).toNumber()
  }
  return undefined
}

function parseTimestamp(rippleTime: number): string | void {
  return rippleTime ? utils.common.rippleTimeToISO8601(rippleTime) : undefined
}

function removeEmptyCounterparty(amount) {
  if (amount.counterparty === '') {
    delete amount.counterparty
  }
}

function removeEmptyCounterpartyInBalanceChanges(balanceChanges) {
  _.forEach(balanceChanges, changes => {
    _.forEach(changes, removeEmptyCounterparty)
  })
}

function removeEmptyCounterpartyInOrderbookChanges(orderbookChanges) {
  _.forEach(orderbookChanges, changes => {
    _.forEach(changes, change => {
      _.forEach(change, removeEmptyCounterparty)
    })
  })
}

function isPartialPayment(tx) {
  return (tx.Flags & utils.common.txFlags.Payment.PartialPayment) !== 0
}

function parseDeliveredAmount(tx: Object): Amount | void {

  if (tx.TransactionType !== 'Payment' ||
      tx.meta.TransactionResult !== 'tesSUCCESS') {
    return undefined
  }

  if (tx.meta.delivered_amount &&
      tx.meta.delivered_amount === 'unavailable') {
    return undefined
  }

  // parsable delivered_amount
  if (tx.meta.delivered_amount) {
    return parseAmount(tx.meta.delivered_amount)
  }

  // DeliveredAmount only present on partial payments
  if (tx.meta.DeliveredAmount) {
    return parseAmount(tx.meta.DeliveredAmount)
  }

  // no partial payment flag, use tx.Amount
  if (tx.Amount && !isPartialPayment(tx)) {
    return parseAmount(tx.Amount)
  }

  // DeliveredAmount field was introduced at
  // ledger 4594095 - after that point its absence
  // on a tx flagged as partial payment indicates
  // the full amount was transferred. The amount
  // transferred with a partial payment before
  // that date must be derived from metadata.
  if (tx.Amount && tx.ledger_index > 4594094) {
    return parseAmount(tx.Amount)
  }

  return undefined
}

function parseOutcome(tx: Object): ?Object {
  const metadata = tx.meta || tx.metaData
  if (!metadata) {
    return undefined
  }
  const balanceChanges = transactionParser.parseBalanceChanges(metadata)
  const orderbookChanges = transactionParser.parseOrderbookChanges(metadata)
  removeEmptyCounterpartyInBalanceChanges(balanceChanges)
  removeEmptyCounterpartyInOrderbookChanges(orderbookChanges)

  return utils.common.removeUndefined({
    result: tx.meta.TransactionResult,
    timestamp: parseTimestamp(tx.date),
    fee: utils.common.dropsToDAC(tx.Fee),
    balanceChanges: balanceChanges,
    orderbookChanges: orderbookChanges,
    ledgerVersion: tx.ledger_index,
    indexInLedger: tx.meta.TransactionIndex,
    deliveredAmount: parseDeliveredAmount(tx)
  })
}

function hexToString(hex: string): ?string {
  return hex ? new Buffer(hex, 'hex').toString('utf-8') : undefined
}

function parseMemos(tx: Object): ?Array<Object> {
  if (!Array.isArray(tx.Memos) || tx.Memos.length === 0) {
    return undefined
  }
  return tx.Memos.map(m => {
    return utils.common.removeUndefined({
      type: m.Memo.parsed_memo_type || hexToString(m.Memo.MemoType),
      format: m.Memo.parsed_memo_format || hexToString(m.Memo.MemoFormat),
      data: m.Memo.parsed_memo_data || hexToString(m.Memo.MemoData)
    })
  })
}

module.exports = {
  parseQuality,
  parseOutcome,
  parseMemos,
  hexToString,
  parseTimestamp,
  adjustQualityForDAC,
  isPartialPayment,
  dropsToDAC: utils.common.dropsToDAC,
  constants: utils.common.constants,
  txFlags: utils.common.txFlags,
  removeUndefined: utils.common.removeUndefined,
  rippleTimeToISO8601: utils.common.rippleTimeToISO8601
}
