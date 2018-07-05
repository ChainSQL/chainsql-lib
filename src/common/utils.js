/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const BigNumber = require('bignumber.js')
const {deriveKeypair} = require('dac-keypairs')

import type {Amount, DacdAmount} from './types.js'

function isValidSecret(secret: string): boolean {
  try {
    deriveKeypair(secret)
    return true
  } catch (err) {
    return false
  }
}

function dropsToDAC(drops: string): string {
  return (new BigNumber(drops)).dividedBy(1000000.0).toString()
}

function DACToDrops(DAC: string): string {
  return (new BigNumber(DAC)).times(1000000.0).floor().toString()
}

function toDacdAmount(amount: Amount): DacdAmount {
  if (amount.currency === 'DAC') {
    return DACToDrops(amount.value)
  }
  return {
    currency: amount.currency,
    issuer: amount.counterparty ? amount.counterparty :
      (amount.issuer ? amount.issuer : undefined),
    value: amount.value
  }
}

function convertKeysFromSnakeCaseToCamelCase(obj: any): any {
  if (typeof obj === 'object') {
    let newKey
    return _.reduce(obj, (result, value, key) => {
      newKey = key
      // taking this out of function leads to error in PhantomJS
      const FINDSNAKE = /([a-zA-Z]_[a-zA-Z])/g
      if (FINDSNAKE.test(key)) {
        newKey = key.replace(FINDSNAKE, r => r[0] + r[2].toUpperCase())
      }
      result[newKey] = convertKeysFromSnakeCaseToCamelCase(value)
      return result
    }, {})
  }
  return obj
}

function removeUndefined(obj: Object): Object {
  return _.omitBy(obj, _.isUndefined)
}

/**
 * @param {Number} rpepoch (seconds since 1/1/2000 GMT)
 * @return {Number} ms since unix epoch
 *
 */
function rippleToUnixTimestamp(rpepoch: number): number {
  return (rpepoch + 0x386D4380) * 1000
}

/**
 * @param {Number|Date} timestamp (ms since unix epoch)
 * @return {Number} seconds since ripple epoch ( 1/1/2000 GMT)
 */
function unixToDacTimestamp(timestamp: number): number {
  return Math.round(timestamp / 1000) - 0x386D4380
}

function rippleTimeToISO8601(rippleTime: number): string {
  return new Date(rippleToUnixTimestamp(rippleTime)).toISOString()
}

function iso8601ToDacTime(iso8601: string): number {
  return unixToDacTimestamp(Date.parse(iso8601))
}

module.exports = {
  dropsToDAC,
  DACToDrops,
  toDacdAmount,
  convertKeysFromSnakeCaseToCamelCase,
  removeUndefined,
  rippleTimeToISO8601,
  iso8601ToDacTime,
  isValidSecret
}
