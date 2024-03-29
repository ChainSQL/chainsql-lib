/* @flow */

'use strict' // eslint-disable-line strict
const addressCodec = require('chainsql-address-codec');
const utils = require('./utils')
var BigNumber = require('bignumber.js');
const {validate, removeUndefined} = utils.common

type AccountData = {
  Sequence: number,
  Account: string,
  Balance: string,
  Flags: number,
  LedgerEntryType: string,
  OwnerCount: number,
  PreviousTxnID: string,
  AccountTxnID?: string,
  PreviousTxnLgrSeq: number,
  index: string
}

type AccountDataResponse = {
  account_data: AccountData,
  ledger_current_index?: number,
  ledger_hash?: string,
  ledger_index: number,
  validated: boolean
}

type AccountInfoOptions = {
  ledgerVersion?: number
}

type AccountInfoResponse = {
  sequence: number,
  zxcBalance: string,
  ownerCount: number,
  previousInitiatedTransactionID: string,
  previousAffectingTransactionID: string,
  previousAffectingTransactionLedgerVersion: number
}

function formatAccountInfo(response: AccountDataResponse) {
  const data = response.account_data
  return removeUndefined({
    sequence: data.Sequence,
    zxcBalance: utils.common.dropsToZxc(data.Balance),
    ownerCount: data.OwnerCount,
    transferFeeMin: data.TransferFeeMin,
    transferFeeMax: data.TransferFeeMax,
    transferRate: data.TransferRate ? new BigNumber(data.TransferRate).shift(-9).toNumber() : undefined,
    previousInitiatedTransactionID: data.AccountTxnID,
    previousAffectingTransactionID: data.PreviousTxnID,
    previousAffectingTransactionLedgerVersion: data.PreviousTxnLgrSeq,
    whiteLists :data.WhiteLists
  })
}
function getAccountInfo(address: string, options: AccountInfoOptions = {}
): Promise<AccountInfoResponse> {
  if(address !== undefined && "0x" === address.substr(0,2)) {
    let hexArray = Buffer.from(address.slice(2),'hex');
    address = addressCodec.encodeAddress(hexArray);
  }
  validate.getAccountInfo({address, options})

  const request = {
    command: 'account_info',
    account: address,
    ledger_index: options.ledgerVersion || 'validated'
  }

  return this.connection.request(request).then(formatAccountInfo)
}

module.exports = getAccountInfo
