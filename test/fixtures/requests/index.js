'use strict';

module.exports = {
  prepareOrder: {
    buy: require('./prepare-order'),
    sell: require('./prepare-order-sell'),
    expiration: require('./prepare-order-expiration')
  },
  prepareOrderCancellation: {
    simple: require('./prepare-order-cancellation'),
    withMemos: require('./prepare-order-cancellation-memos')
  },
  preparePayment: {
    normal: require('./prepare-payment'),
    minAmountZXC: require('./prepare-payment-min-zxc'),
    minAmount: require('./prepare-payment-min'),
    wrongAddress: require('./prepare-payment-wrong-address'),
    wrongAmount: require('./prepare-payment-wrong-amount'),
    wrongPartial: require('./prepare-payment-wrong-partial'),
    allOptions: require('./prepare-payment-all-options'),
    noCounterparty: require('./prepare-payment-no-counterparty')
  },
  prepareSettings: {
    domain: require('./prepare-settings'),
    signers: require('./prepare-settings-signers')
  },
  prepareEscrowCreation: {
    normal: require('./prepare-escrow-creation'),
    full: require('./prepare-escrow-creation-full')
  },
  prepareEscrowExecution: {
    normal: require('./prepare-escrow-execution'),
    simple: require('./prepare-escrow-execution-simple')
  },
  prepareEscrowCancellation: {
    normal: require('./prepare-escrow-cancellation'),
    memos: require('./prepare-escrow-cancellation-memos')
  },
  preparePaymentChannelCreate: {
    normal: require('./prepare-payment-channel-create'),
    full: require('./prepare-payment-channel-create-full')
  },
  preparePaymentChannelFund: {
    normal: require('./prepare-payment-channel-fund'),
    full: require('./prepare-payment-channel-fund-full')
  },
  preparePaymentChannelClaim: {
    normal: require('./prepare-payment-channel-claim'),
    full: require('./prepare-payment-channel-claim-full'),
    close: require('./prepare-payment-channel-claim-close'),
    renew: require('./prepare-payment-channel-claim-renew'),
    noSignature: require('./prepare-payment-channel-claim-no-signature')
  },
  prepareTrustline: {
    simple: require('./prepare-trustline-simple'),
    complex: require('./prepare-trustline'),
    frozen: require('./prepare-trustline-frozen.json')
  },
  sign: {
    normal: require('./sign'),
    escrow: require('./sign-escrow.json'),
    signAs: require('./sign-as')
  },
  signPaymentChannelClaim: require('./sign-payment-channel-claim'),
  getPaths: {
    normal: require('./getpaths/normal'),
    UsdToUsd: require('./getpaths/usd2usd'),
    ZxcToZxc: require('./getpaths/zxc2zxc'),
    ZxcToZxcNotEnough: require('./getpaths/zxc2zxc-not-enough'),
    NotAcceptCurrency: require('./getpaths/not-accept-currency'),
    NoPaths: require('./getpaths/no-paths'),
    NoPathsSource: require('./getpaths/no-paths-source-amount'),
    NoPathsWithCurrencies: require('./getpaths/no-paths-with-currencies'),
    sendAll: require('./getpaths/send-all'),
    invalid: require('./getpaths/invalid'),
    issuer: require('./getpaths/issuer')
  },
  getOrderbook: {
    normal: require('./get-orderbook'),
    withZXC: require('./get-orderbook-with-zxc')
  },
  computeLedgerHash: {
    header: require('./compute-ledger-hash'),
    transactions: require('./compute-ledger-hash-transactions')
  },
  combine: {
    setDomain: require('./combine.json')
  }
};
