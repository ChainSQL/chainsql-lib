'use strict' // eslint-disable-line strict
const utils = require('./utils')

module.exports = {
  Connection: require('./connection'),
  constants: require('./constants'),
  errors: require('./errors'),
  validate: require('./validate'),
  txFlags: require('./txflags').txFlags,
  serverInfo: require('./serverinfo'),
  dropsToZxc: utils.dropsToZxc,
  zxcToDrops: utils.zxcToDrops,
  toChainsqldAmount: utils.toChainsqldAmount,
  generateAddress: utils.generateAddress,
  generateAddressAPI: utils.generateAddressAPI,
  removeUndefined: utils.removeUndefined,
  convertKeysFromSnakeCaseToCamelCase:
    utils.convertKeysFromSnakeCaseToCamelCase,
  iso8601ToChainsqlTime: utils.iso8601ToChainsqlTime,
  rippleTimeToISO8601: utils.rippleTimeToISO8601,
  isValidSecret: utils.isValidSecret
}
