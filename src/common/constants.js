'use strict' // eslint-disable-line strict
const flagIndices = require('./txflags').txFlagIndices.AccountSet

const accountRootFlags = {
  PasswordSpent: 0x00010000, // password set fee is spent
  RequireDestTag: 0x00020000, // require a DestinationTag for payments
  RequireAuth: 0x00040000, // require a authorization to hold IOUs
  DisallowZXC: 0x00080000, // disallow sending ZXC
  DisableMaster: 0x00100000,  // force regular key
  NoFreeze: 0x00200000, // permanently disallowed freezing trustlines
  GlobalFreeze: 0x00400000, // trustlines globally frozen
  DefaultChainsql: 0x00800000
}

const AccountFlags = {
  passwordSpent: accountRootFlags.PasswordSpent,
  requireDestinationTag: accountRootFlags.RequireDestTag,
  requireAuthorization: accountRootFlags.RequireAuth,
  disallowIncomingZXC: accountRootFlags.DisallowZXC,
  disableMasterKey: accountRootFlags.DisableMaster,
  noFreeze: accountRootFlags.NoFreeze,
  globalFreeze: accountRootFlags.GlobalFreeze,
  defaultChainsql: accountRootFlags.DefaultChainsql
}

const AccountFlagIndices = {
  requireDestinationTag: flagIndices.asfRequireDest,
  requireAuthorization: flagIndices.asfRequireAuth,
  disallowIncomingZXC: flagIndices.asfDisallowZXC,
  disableMasterKey: flagIndices.asfDisableMaster,
  enableTransactionIDTracking: flagIndices.asfAccountTxnID,
  noFreeze: flagIndices.asfNoFreeze,
  globalFreeze: flagIndices.asfGlobalFreeze,
  defaultChainsql: flagIndices.asfDefaultChainsql
}

const AccountFields = {
  EmailHash: {name: 'emailHash', encoding: 'hex',
              length: 32, defaults: '0'},
  MessageKey: {name: 'messageKey'},
  Domain: {name: 'domain', encoding: 'hex'},
  TransferRate: {name: 'transferRate', defaults: 0, shift: 9},
  TransferFeeMin : {name :"transferFeeMin",encoding:'hex'},
  TransferFeeMax : {name :"transferFeeMax",encoding:'hex'},
  SetFlag: {name: 'setFlag', defaults: 0,shift: 9}
}

module.exports = {
  AccountFields,
  AccountFlagIndices,
  AccountFlags
}
