/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const {validate, iso8601ToRippleTime, xrpToDrops} = utils.common
import type {Instructions, Prepare} from './types.js'

type PaymentChannelCreate = {
  amount: string,
  destination: string,
  settleDelay: number,
  publicKey: string,
  cancelAfter?: string,
  sourceTag?: number,
  destinationTag?: number
}

function createPaymentChannelCreateTransaction(account: string,
  paymentChannel: PaymentChannelCreate
): Object {
  const txJSON: Object = {
    Account: account,
    TransactionType: 'PaymentChannelCreate',
    Amount: xrpToDrops(paymentChannel.amount),
    Destination: paymentChannel.destination,
    SettleDelay: paymentChannel.settleDelay,
    PublicKey: paymentChannel.publicKey.toUpperCase()
  }

  if (paymentChannel.cancelAfter !== undefined) {
    txJSON.CancelAfter = iso8601ToRippleTime(paymentChannel.cancelAfter)
  }
  if (paymentChannel.sourceTag !== undefined) {
    txJSON.SourceTag = paymentChannel.sourceTag
  }
  if (paymentChannel.destinationTag !== undefined) {
    txJSON.DestinationTag = paymentChannel.destinationTag
  }

  return txJSON
}

function preparePaymentChannelCreate(address: string,
  paymentChannelCreate: PaymentChannelCreate,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.preparePaymentChannelCreate(
    {address, paymentChannelCreate, instructions})
  const txJSON = createPaymentChannelCreateTransaction(
    address, paymentChannelCreate)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = preparePaymentChannelCreate
