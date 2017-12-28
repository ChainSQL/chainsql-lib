/* @flow */
'use strict' // eslint-disable-line strict
const common = require('../common')
const keypairs = require('chainsql-keypairs')
const binary = require('chainsql-binary-codec')
const {validate, zxcToDrops} = common

function signPaymentChannelClaim(channel: string, amount: string,
  privateKey: string
): string {
  validate.signPaymentChannelClaim({channel, amount, privateKey})

  const signingData = binary.encodeForSigningClaim({
    channel: channel,
    amount: zxcToDrops(amount),
  })
  return keypairs.sign(signingData, privateKey)
}

module.exports = signPaymentChannelClaim
