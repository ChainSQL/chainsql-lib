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
type SettingDisallowIncomingZXC = {
  disallowIncomingZXC?: boolean,
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
type SettingDefaultChainsql = {
  defaultChainsql?: boolean,
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

export type Settings = SettingRegularKey |
  SettingTransferRate | SettingDomain | SettingMessageKey |
  SettingEmailHash | SettingDefaultChainsql |
  SettingGlobalFreeze | SettingNoFreeze | SettingEnableTransactionIDTracking |
  SettingDisableMasterKey | SettingDisallowIncomingZXC |
  SettingRequireAuthorization | SettingRequireDestinationTag |
  SettingPasswordSpent
