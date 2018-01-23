/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const {validate, iso8601ToChainsqlTime, zxcToDrops} = utils.common
import type {Instructions, Prepare} from './types.js'

type PaymentChannelFund = {
  channel: string,
  amount: string,
  expiration?: string
}

function createPaymentChannelFundTransaction(account: string,
  fund: PaymentChannelFund
): Object {
  const txJSON = {
    Account: account,
    TransactionType: 'PaymentChannelFund',
    Channel: fund.channel,
    Amount: zxcToDrops(fund.amount)
  }

  if (fund.expiration !== undefined) {
    txJSON.Expiration = iso8601ToChainsqlTime(fund.expiration)
  }

  return txJSON
}

function preparePaymentChannelFund(address: string,
  paymentChannelFund: PaymentChannelFund,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.preparePaymentChannelFund(
    {address, paymentChannelFund, instructions})
  const txJSON = createPaymentChannelFundTransaction(
    address, paymentChannelFund)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = preparePaymentChannelFund
