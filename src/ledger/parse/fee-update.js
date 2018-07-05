'use strict' // eslint-disable-line strict
const BigNumber = require('bignumber.js')
const {dropsToDAC} = require('./utils')

function parseFeeUpdate(tx: Object) {
  const baseFeeDrops = (new BigNumber(tx.BaseFee, 16)).toString()
  return {
    baseFeeDac: dropsToDAC(baseFeeDrops),
    referenceFeeUnits: tx.ReferenceFeeUnits,
    reserveBaseDac: dropsToDAC(tx.ReserveBase),
    reserveIncrementDac: dropsToDAC(tx.ReserveIncrement)
  }
}

module.exports = parseFeeUpdate
