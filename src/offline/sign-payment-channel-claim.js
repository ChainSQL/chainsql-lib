/* @flow */
'use strict' // eslint-disable-line strict
const common = require('../common')
const keypairs = require('dac-keypairs')
const binary = require('dac-binary-codec')
const {validate, DACToDrops} = common

function signPaymentChannelClaim(channel: string, amount: string,
  privateKey: string
): string {
  validate.signPaymentChannelClaim({channel, amount, privateKey})

  const signingData = binary.encodeForSigningClaim({
    channel: channel,
    amount: DACToDrops(amount),
  })
  return keypairs.sign(signingData, privateKey)
}

module.exports = signPaymentChannelClaim
