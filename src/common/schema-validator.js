// flow is disabled for this file until support for requiring json is added:
// https://github.com/facebook/flow/issues/167
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const assert = require('assert')
const Validator = require('jsonschema').Validator
const ValidationError = require('./errors').ValidationError
const {isValidAddress} = require('ripple-address-codec')
const {isValidSecret} = require('./utils')

function loadSchemas() {
  // listed explicitly for webpack (instead of scanning schemas directory)
  const schemas = [
    require('./schemas/objects/tx-json.json'),
    require('./schemas/objects/tx-type.json'),
    require('./schemas/objects/hash128.json'),
    require('./schemas/objects/hash256.json'),
    require('./schemas/objects/sequence.json'),
    require('./schemas/objects/signature.json'),
    require('./schemas/objects/issue.json'),
    require('./schemas/objects/ledgerversion.json'),
    require('./schemas/objects/max-adjustment.json'),
    require('./schemas/objects/memo.json'),
    require('./schemas/objects/memos.json'),
    require('./schemas/objects/public-key.json'),
    require('./schemas/objects/uint32.json'),
    require('./schemas/objects/value.json'),
    require('./schemas/objects/source-adjustment.json'),
    require('./schemas/objects/destination-adjustment.json'),
    require('./schemas/objects/tag.json'),
    require('./schemas/objects/lax-amount.json'),
    require('./schemas/objects/lax-lax-amount.json'),
    require('./schemas/objects/min-adjustment.json'),
    require('./schemas/objects/source-exact-adjustment.json'),
    require('./schemas/objects/destination-exact-adjustment.json'),
    require('./schemas/objects/tx-hash.json'),
    require('./schemas/objects/address.json'),
    require('./schemas/objects/adjustment.json'),
    require('./schemas/objects/quality.json'),
    require('./schemas/objects/amount.json'),
    require('./schemas/objects/amount-base.json'),
    require('./schemas/objects/balance.json'),
    require('./schemas/objects/blob.json'),
    require('./schemas/objects/currency.json'),
    require('./schemas/objects/signed-value.json'),
    require('./schemas/objects/orderbook.json'),
    require('./schemas/objects/instructions.json'),
    require('./schemas/objects/settings.json'),
    require('./schemas/specifications/settings.json'),
    require('./schemas/specifications/payment.json'),
    require('./schemas/specifications/escrow-cancellation.json'),
    require('./schemas/specifications/order-cancellation.json'),
    require('./schemas/specifications/order.json'),
    require('./schemas/specifications/escrow-execution.json'),
    require('./schemas/specifications/escrow-creation.json'),
    require('./schemas/specifications/payment-channel-create.json'),
    require('./schemas/specifications/payment-channel-fund.json'),
    require('./schemas/specifications/payment-channel-claim.json'),
    require('./schemas/specifications/trustline.json'),
    require('./schemas/output/sign.json'),
    require('./schemas/output/submit.json'),
    require('./schemas/output/get-account-info.json'),
    require('./schemas/output/get-balances.json'),
    require('./schemas/output/get-balance-sheet.json'),
    require('./schemas/output/get-ledger.json'),
    require('./schemas/output/get-orderbook.json'),
    require('./schemas/output/get-orders.json'),
    require('./schemas/output/order-change.json'),
    require('./schemas/output/get-payment-channel.json'),
    require('./schemas/output/prepare.json'),
    require('./schemas/output/ledger-event.json'),
    require('./schemas/output/get-paths.json'),
    require('./schemas/output/get-server-info.json'),
    require('./schemas/output/get-settings.json'),
    require('./schemas/output/orderbook-orders.json'),
    require('./schemas/output/outcome.json'),
    require('./schemas/output/get-transaction.json'),
    require('./schemas/output/get-transactions.json'),
    require('./schemas/output/get-trustlines.json'),
    require('./schemas/output/sign-payment-channel-claim.json'),
    require('./schemas/output/verify-payment-channel-claim.json'),
    require('./schemas/input/get-balances.json'),
    require('./schemas/input/get-balance-sheet.json'),
    require('./schemas/input/get-ledger.json'),
    require('./schemas/input/get-orders.json'),
    require('./schemas/input/get-orderbook.json'),
    require('./schemas/input/get-paths.json'),
    require('./schemas/input/get-payment-channel.json'),
    require('./schemas/input/api-options.json'),
    require('./schemas/input/get-settings.json'),
    require('./schemas/input/get-account-info.json'),
    require('./schemas/input/get-transaction.json'),
    require('./schemas/input/get-transactions.json'),
    require('./schemas/input/get-trustlines.json'),
    require('./schemas/input/prepare-payment.json'),
    require('./schemas/input/prepare-order.json'),
    require('./schemas/input/prepare-trustline.json'),
    require('./schemas/input/prepare-order-cancellation.json'),
    require('./schemas/input/prepare-settings.json'),
    require('./schemas/input/prepare-escrow-creation.json'),
    require('./schemas/input/prepare-escrow-cancellation.json'),
    require('./schemas/input/prepare-escrow-execution.json'),
    require('./schemas/input/prepare-payment-channel-create.json'),
    require('./schemas/input/prepare-payment-channel-fund.json'),
    require('./schemas/input/prepare-payment-channel-claim.json'),
    require('./schemas/input/compute-ledger-hash.json'),
    require('./schemas/input/sign.json'),
    require('./schemas/input/submit.json'),
    require('./schemas/input/generate-address.json'),
    require('./schemas/input/sign-payment-channel-claim.json'),
    require('./schemas/input/verify-payment-channel-claim.json'),
    require('./schemas/input/combine.json')
  ]
  const titles = _.map(schemas, schema => schema.title)
  const duplicates = _.keys(_.pick(_.countBy(titles), count => count > 1))
  assert(duplicates.length === 0, 'Duplicate schemas for: ' + duplicates)
  const v = new Validator()
  // Register custom format validators that ignore undefined instances
  // since jsonschema will still call the format validator on a missing
  // (optional)  property
  v.customFormats.address = function(instance) {
    if (instance === undefined) {
      return true
    }
    return isValidAddress(instance)
  }
  v.customFormats.secret = function(instance) {
    if (instance === undefined) {
      return true
    }
    return isValidSecret(instance)
  }

  // Register under the root URI '/'
  _.forEach(schemas, schema => v.addSchema(schema, '/' + schema.title))
  return v
}

const v = loadSchemas()

function schemaValidate(schemaName: string, object: any): void {
  // Lookup under the root URI '/'
  const schema = v.getSchema('/' + schemaName)
  if (schema === undefined) {
    throw new ValidationError('no schema for ' + schemaName)
  }
  const result = v.validate(object, schema)
  if (!result.valid) {
    throw new ValidationError(result.errors.join())
  }
}

module.exports = {
  schemaValidate,
  isValidSecret
}
