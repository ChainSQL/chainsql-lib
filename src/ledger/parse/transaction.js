/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')
const parsePayment = require('./payment')
const parseTrustline = require('./trustline')
const parseOrder = require('./order')
const parseOrderCancellation = require('./cancellation')
const parseSettings = require('./settings')
const parseEscrowCreation = require('./escrow-creation')
const parseEscrowExecution = require('./escrow-execution')
const parseEscrowCancellation = require('./escrow-cancellation')
const parsePaymentChannelCreate = require('./payment-channel-create')
const parsePaymentChannelFund = require('./payment-channel-fund')
const parsePaymentChannelClaim = require('./payment-channel-claim')
const parseFeeUpdate = require('./fee-update')
const parseAmendment = require('./amendment')
const parseTableListSet = require('./tablelistset');
const parseSqlStatement = require('./sqlstatement')
const parseSqlTransaction = require('./sql-transaction')
const parseContract = require('./contract');
const parseSchemaCreate = require('./schema-create');
const parseSchemaModify = require('./schema-modify');
const parseFreezeAccount = require('./freeze-account');
const parseSchemaDelete = require('./schema-delete');
const parseAuthorize = require('./authorize');

function parseTransactionType(type) {
  const mapping = {
    Payment: 'payment',
    TrustSet: 'trustline',
    OfferCreate: 'order',
    OfferCancel: 'orderCancellation',
    AccountSet: 'settings',
    SetRegularKey: 'settings',
    EscrowCreate: 'escrowCreation',
    EscrowFinish: 'escrowExecution',
    EscrowCancel: 'escrowCancellation',
    PaymentChannelCreate: 'paymentChannelCreate',
    PaymentChannelFund: 'paymentChannelFund',
    PaymentChannelClaim: 'paymentChannelClaim',
    SignerListSet: 'settings',
    SetFee: 'feeUpdate',          // pseudo-transaction
    EnableAmendment: 'amendment', // pseudo-transaction
    TableListSet: 'tableListSet',
    SQLStatement: 'sqlStatement',
    SQLTransaction:'sqlTransaction',
    Contract: 'contract',
    SchemaCreate: 'schemaCreate',
    SchemaModify: 'schemaModify',
    FreezeAccount: 'freezeAccount',
    SchemaDelete: 'schemaDelete',
    Authorize:'authorize',
  }
  return mapping[type] || null
}

function parseTransaction(tx: Object): Object {
  const type = parseTransactionType(tx.TransactionType)
  const mapping = {
    'payment': parsePayment,
    'trustline': parseTrustline,
    'order': parseOrder,
    'orderCancellation': parseOrderCancellation,
    'settings': parseSettings,
    'escrowCreation': parseEscrowCreation,
    'escrowExecution': parseEscrowExecution,
    'escrowCancellation': parseEscrowCancellation,
    'paymentChannelCreate': parsePaymentChannelCreate,
    'paymentChannelFund': parsePaymentChannelFund,
    'paymentChannelClaim': parsePaymentChannelClaim,
    'feeUpdate': parseFeeUpdate,
    'amendment': parseAmendment,
    'tableListSet':parseTableListSet,
    'sqlStatement':parseSqlStatement,
    'sqlTransaction':parseSqlTransaction,
    'contract': parseContract,
    'schemaCreate': parseSchemaCreate,
    'schemaModify': parseSchemaModify,
    'freezeAccount': parseFreezeAccount,
    'schemaDelete': parseSchemaDelete,
    'authorize': parseAuthorize,
  }
  const parser = mapping[type]
  assert(parser !== undefined, 'Unrecognized transaction type')
  const specification = parser(tx)
  const outcome = utils.parseOutcome(tx)
  return utils.removeUndefined({
    type: type,
    address: tx.Account,
    sequence: tx.Sequence,
    id: tx.hash,
    specification: utils.removeUndefined(specification),
    outcome: outcome ? utils.removeUndefined(outcome) : undefined
  })
}

module.exports = parseTransaction
