/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('../utils')
import type {Amount, ChainsqldAmount} from '../../common/types.js'


function parseAmount(amount: ChainsqldAmount): Amount {
  if (typeof amount === 'string') {
    return {
      currency: 'ZXC',
      value: utils.common.dropsToZxc(amount)
    }
  }
  return {
    currency: amount.currency,
    value: amount.value,
    counterparty: amount.issuer
  }
}

module.exports = parseAmount
