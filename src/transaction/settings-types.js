/* @flow */
'use strict' // eslint-disable-line strict

type SettingPasswordSpent = {
  passwordSpent?: boolean,
}
type SettingRequireDestinationTag = {
  requireDestinationTag?: boolean,
}
type SettingRequireAuthorization = {
  requireAuthorization?: boolean,
}
type SettingDisallowIncomingDAC = {
  disallowIncomingDAC?: boolean,
}
type SettingDisableMasterKey = {
  disableMasterKey?: boolean,
}
type SettingEnableTransactionIDTracking = {
  enableTransactionIDTracking?: boolean,
}
type SettingNoFreeze = {
  noFreeze?: boolean,
}
type SettingGlobalFreeze = {
  globalFreeze?: boolean,
}
type SettingDefaultDac = {
  defaultDac?: boolean,
}
type SettingEmailHash = {
  emailHash?: ?string,
}
type SettingMessageKey = {
  messageKey?: string,
}
type SettingDomain = {
  domain?: string,
}
type SettingTransferRate = {
  transferRate?: ?number,
}
type SettingRegularKey = {
  regularKey?: string
}

type SettingTransferfeeMin = {
  transferFeeMin?: string
}

type SettingTransferfeeMax = {
  transferFeeMax?: string
}

export type Settings = SettingRegularKey |
  SettingTransferRate | SettingDomain | SettingMessageKey |
  SettingEmailHash | SettingDefaultDac |
  SettingGlobalFreeze | SettingNoFreeze | SettingEnableTransactionIDTracking |
  SettingDisableMasterKey | SettingDisallowIncomingDAC |
  SettingRequireAuthorization | SettingRequireDestinationTag |
  SettingPasswordSpent
