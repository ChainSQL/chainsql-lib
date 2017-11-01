'use strict' // eslint-disable-line strict
const BigNumber = require('bignumber.js')
const {dropsToXrp} = require('./utils')

function parseFeeUpdate(tx: Object) {
  const baseFeeDrops = (new BigNumber(tx.BaseFee, 16)).toString()
  return {
    baseFeeZXC: dropsToXrp(baseFeeDrops),
    referenceFeeUnits: tx.ReferenceFeeUnits,
    reserveBaseZXC: dropsToXrp(tx.ReserveBase),
    reserveIncrementZXC: dropsToXrp(tx.ReserveIncrement)
  }
}

module.exports = parseFeeUpdate
