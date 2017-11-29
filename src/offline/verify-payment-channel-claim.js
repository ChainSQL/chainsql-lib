/* @flow */
'use strict' // eslint-disable-line strict
const common = require('../common')
const keypairs = require('chainsql-keypairs')
const binary = require('chainsql-binary-codec')
const {validate, xrpToDrops} = common

function verifyPaymentChannelClaim(channel: string, amount: string,
  signature: string, publicKey: string
): string {
  validate.verifyPaymentChannelClaim({channel, amount, signature, publicKey})

  const signingData = binary.encodeForSigningClaim({
    channel: channel,
    amount: xrpToDrops(amount),
  })
  return keypairs.verify(signingData, signature, publicKey)
}

module.exports = verifyPaymentChannelClaim
