/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const {validate} = utils.common
const parseOrderbookOrder = require('./parse/orderbook-order')
import type {Connection} from '../common/connection.js'
import type {OrdersOptions, OrderSpecification} from './types.js'
import type {Amount, Issue} from '../common/types.js'

type Orderbook = {
  base: Issue,
  counter: Issue
}

type OrderbookItem = {
   specification: OrderSpecification,
   properties: {
    maker: string,
    sequence: number,
    makerExchangeRate: string
  },
  state?: {
    fundedAmount: Amount,
    priceOfFundedAmount: Amount
  }
}

type OrderbookOrders = Array<OrderbookItem>

type GetOrderbook = {
  bids: OrderbookOrders,
  asks: OrderbookOrders
}

// account is to specify a "perspective", which affects which unfunded offers
// are returned
function getBookOffers(connection: Connection, account: string,
    ledgerVersion?: number, limit?: number, takerGets: Issue,
    takerPays: Issue
): Promise {
  return connection.request(utils.renameCounterpartyToIssuerInOrder({
    command: 'book_offers',
    taker_gets: takerGets,
    taker_pays: takerPays,
    ledger_index: ledgerVersion || 'validated',
    limit: limit,
    taker: account
  })).then(data => data.offers)
}

function isSameIssue(a: Amount, b: Amount) {
  return a.currency === b.currency && a.counterparty === b.counterparty
}

function directionFilter(direction: string, order: OrderbookItem) {
  return order.specification.direction === direction
}

function flipOrder(order: OrderbookItem) {
  const specification = order.specification
  const flippedSpecification = {
    quantity: specification.totalPrice,
    totalPrice: specification.quantity,
    direction: specification.direction === 'buy' ? 'sell' : 'buy'
  }
  const newSpecification = _.merge({}, specification, flippedSpecification)
  return _.merge({}, order, {specification: newSpecification})
}

function alignOrder(base: Amount, order: OrderbookItem) {
  const quantity = order.specification.quantity
  return isSameIssue(quantity, base) ? order : flipOrder(order)
}

function formatBidsAndAsks(orderbook: Orderbook, offers) {
  // the "base" currency is the currency that you are buying or selling
  // the "counter" is the currency that the "base" is priced in
  // a "bid"/"ask" is an order to buy/sell the base, respectively
  // for bids: takerGets = totalPrice = counter, takerPays = quantity = base
  // for asks: takerGets = quantity = base, takerPays = totalPrice = counter
  // quality = takerPays / takerGets; price = totalPrice / quantity
  // for bids: lowest quality => lowest quantity/totalPrice => highest price
  // for asks: lowest quality => lowest totalPrice/quantity => lowest price
  // for both bids and asks, lowest quality is closest to mid-market
  // we sort the orders so that earlier orders are closer to mid-market
  const orders = _.sortBy(offers, 'quality').map(parseOrderbookOrder)
  const alignedOrders = orders.map(_.partial(alignOrder, orderbook.base))
  const bids = alignedOrders.filter(_.partial(directionFilter, 'buy'))
  const asks = alignedOrders.filter(_.partial(directionFilter, 'sell'))
  return {bids, asks}
}

function getOrderbook(address: string, orderbook: Orderbook,
    options: OrdersOptions = {}
): Promise<GetOrderbook> {
  validate.getOrderbook({address, orderbook, options})

  const getter = _.partial(getBookOffers, this.connection, address,
    options.ledgerVersion, options.limit)
  const getOffers = _.partial(getter, orderbook.base, orderbook.counter)
  const getReverseOffers = _.partial(getter, orderbook.counter, orderbook.base)
  return Promise.all([getOffers(), getReverseOffers()]).then(data =>
    formatBidsAndAsks(orderbook, _.flatten(data)))
}

module.exports = getOrderbook
