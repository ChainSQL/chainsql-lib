'use strict' // eslint-disable-line strict
const utils = require('./utils')

module.exports = {
  Connection: require('./connection'),
  constants: require('./constants'),
  errors: require('./errors'),
  validate: require('./validate'),
  txFlags: require('./txflags').txFlags,
  serverInfo: require('./serverinfo'),
  dropsToDAC: utils.dropsToDAC,
  DACToDrops: utils.DACToDrops,
  toDacdAmount: utils.toDacdAmount,
  generateAddress: utils.generateAddress,
  generateAddressAPI: utils.generateAddressAPI,
  removeUndefined: utils.removeUndefined,
  convertKeysFromSnakeCaseToCamelCase:
    utils.convertKeysFromSnakeCaseToCamelCase,
  iso8601ToDacTime: utils.iso8601ToDacTime,
  rippleTimeToISO8601: utils.rippleTimeToISO8601,
  isValidSecret: utils.isValidSecret
}
