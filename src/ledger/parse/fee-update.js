'use strict' // eslint-disable-line strict
const BigNumber = require('bignumber.js')
const {dropsToZxc} = require('./utils')

function parseFeeUpdate(tx: Object) {
  const baseFeeDrops = (new BigNumber(tx.BaseFee, 16)).toString()
  return {
    baseFeeZXC: dropsToZxc(baseFeeDrops),
    referenceFeeUnits: tx.ReferenceFeeUnits,
    reserveBaseZXC: dropsToZxc(tx.ReserveBase),
    reserveIncrementZXC: dropsToZxc(tx.ReserveIncrement)
  }
}

module.exports = parseFeeUpdate
