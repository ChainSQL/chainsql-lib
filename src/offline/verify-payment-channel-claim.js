/* @flow */
'use strict' // eslint-disable-line strict
const common = require('../common')
const keypairs = require('dac-keypairs')
const binary = require('dac-binary-codec')
const {validate, DACToDrops} = common

function verifyPaymentChannelClaim(channel: string, amount: string,
  signature: string, publicKey: string
): string {
  validate.verifyPaymentChannelClaim({channel, amount, signature, publicKey})

  const signingData = binary.encodeForSigningClaim({
    channel: channel,
    amount: DACToDrops(amount),
  })
  return keypairs.verify(signingData, signature, publicKey)
}

module.exports = verifyPaymentChannelClaim
