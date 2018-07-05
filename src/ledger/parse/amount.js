/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('../utils')
import type {Amount, DacdAmount} from '../../common/types.js'


function parseAmount(amount: DacdAmount): Amount {
  if (typeof amount === 'string') {
    return {
      currency: 'DAC',
      value: utils.common.dropsToDAC(amount)
    }
  }
  return {
    currency: amount.currency,
    value: amount.value,
    counterparty: amount.issuer
  }
}

module.exports = parseAmount
