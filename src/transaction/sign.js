/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const keypairs = require('chainsql-keypairs')
const binary = require('chainsql-binary-codec')
const {computeBinaryTransactionHash} = require('chainsql-hashes')
var LRU = require("lru-cache")
const validate = utils.common.validate
var cache = new LRU({
  max: 50,
  ttl: 1000 * 60 * 5,
  ttlAutopurge: true,
})
function computeSignature(tx: Object, privateKey: string, signAs: ?string) {
  const signingData = signAs ?
    binary.encodeForMultiSigningByte(tx, signAs) : binary.encodeForSigningByte(tx)
  return keypairs.signBytes(signingData, privateKey)
}

function sign(txJSON: string, secret: string, options: Object = {}
): {signedTransaction: string; id: string} {
  validate.sign({txJSON, secret})
  // we can't validate that the secret matches the account because
  // the secret could correspond to the regular key

  const tx = JSON.parse(txJSON)
  if (tx.TxnSignature || tx.Signers) {
    throw new utils.common.errors.ValidationError(
      'txJSON must not contain "TxnSignature" or "Signers" properties')
  }

  var keypair = cache.get(secret)
  if(keypair == undefined){
    keypair = keypairs.deriveKeypair(secret);
    cache.set(secret, keypair);
  }
  
  tx.SigningPubKey = options.signAs ? '' : keypair.publicKey

  if (options.signAs) {
    const signer = {
      Account: options.signAs,
      SigningPubKey: keypair.publicKey,
      TxnSignature: computeSignature(tx, keypair.privateKey, options.signAs)
    }
    tx.Signers = [{Signer: signer}]
  } else {
    tx.TxnSignature = computeSignature(tx, keypair.privateKey)
  }

  const serialized = binary.encode(tx)
  return {
    signedTransaction: serialized,
    id: computeBinaryTransactionHash(serialized)
  }
}

module.exports = sign
