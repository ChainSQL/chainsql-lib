
/* eslint-disable max-params */
'use strict'; // eslint-disable-line strict

var _ = require('lodash');
var binary = require('chainsql-binary-codec');

var _require = require('chainsql-hashes'),
    computeTransactionHash = _require.computeTransactionHash;

var utils = require('chainsql-lib/dist/npm/ledger/utils');
var parseTransaction = require('chainsql-lib/dist/npm/ledger/parse/transaction');
var getTransaction = require('chainsql-lib/dist/npm/ledger/transaction');
var validate = utils.common.validate;


function parseBinaryTransaction(transaction) {
  var tx = binary.decode(transaction.tx_blob);
  tx.hash = computeTransactionHash(tx);
  tx.ledger_index = transaction.ledger_index;
  return {
    tx: tx,
    meta: binary.decode(transaction.meta),
    validated: transaction.validated
  };
}

function parseContractTxTransaction(tx) {
  var _tx = tx.tx_blob ? parseBinaryTransaction(tx) : tx;
  // rippled uses a different response format for 'account_tx' than 'tx'
  return parseTransaction(_.assign({}, _tx.tx, { meta: _tx.meta, validated: _tx.validated }));
}

function counterpartyFilter(filters, tx) {
  if (tx.address === filters.counterparty || tx.specification && (tx.specification.destination && tx.specification.destination.address === filters.counterparty || tx.specification.counterparty === filters.counterparty)) {
    return true;
  }
  return false;
}

function transactionFilter(address, filters, tx) {
  if (filters.excludeFailures && tx.outcome.result !== 'tesSUCCESS') {
    return false;
  }
  if (filters.types && !_.includes(filters.types, tx.type)) {
    return false;
  }
  if (filters.initiated === true && tx.address !== address) {
    return false;
  }
  if (filters.initiated === false && tx.address === address) {
    return false;
  }
  if (filters.counterparty && !counterpartyFilter(filters, tx)) {
    return false;
  }
  return true;
}

function orderFilter(options, tx) {
  return !options.startTx || (options.earliestFirst ? utils.compareTransactions(tx, options.startTx) > 0 : utils.compareTransactions(tx, options.startTx) < 0);
}

function formatPartialResponse(address, options, data) {
  return {
    marker: data.marker,
    results: data.transactions.filter(function (tx) {
      return tx.validated;
    }).map(parseContractTxTransaction).filter(_.partial(transactionFilter, address, options)).filter(_.partial(orderFilter, options))
  };
}


function getContractTx(connection, address,options) {
  const request = {
    command: 'contract_tx',
    contract_address: address,
    // -1 is equivalent to earliest available validated ledger
    ledger_index_min: options.ledgerIndexMin || -1,
    // -1 is equivalent to most recent available validated ledger
    ledger_index_max: options.ledgerIndexMax || -1,
    limit: options.limit,
    marker: options.marker
  }

  return connection.request(request).then(response =>
    formatPartialResponse(address, options, response))
}


function getContractTransactions(address, options){
    //validate.getTransactions({address, options})
    var _this = this;
    const defaults = {maxLedgerVersion: -1}
    const newOptions = _.assign({}, defaults, options)
    const getter = _.partial(getContractTx, _this.connection, address, newOptions)
    return getter().then(function (data) {
      if(data.marker)
        return data
      else
        return data.results
    });


  }
module.exports = getContractTransactions;