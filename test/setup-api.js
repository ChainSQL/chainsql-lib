'use strict'; // eslint-disable-line 

const ChainsqlAPI = require('ripple-api').ChainsqlAPI;
const ChainsqlAPIBroadcast = require('ripple-api').ChainsqlAPIBroadcast;
const ledgerClosed = require('./fixtures/rippled/ledger-close');
const createMockChainsqld = require('./mock-rippled');
const {getFreePort} = require('./utils/net-utils');


function setupMockChainsqldConnection(testcase, port) {
  return new Promise((resolve, reject) => {
    testcase.mockChainsqld = createMockChainsqld(port);
    testcase._mockedServerPort = port;
    testcase.api = new ChainsqlAPI({server: 'ws://localhost:' + port});
    testcase.api.connect().then(() => {
      testcase.api.once('ledger', () => resolve());
      testcase.api.connection._ws.emit('message', JSON.stringify(ledgerClosed));
    }).catch(reject);
  });
}

function setupMockChainsqldConnectionForBroadcast(testcase, ports) {
  return new Promise((resolve, reject) => {
    const servers = ports.map(port => 'ws://localhost:' + port);
    testcase.mocks = ports.map(port => createMockChainsqld(port));
    testcase.api = new ChainsqlAPIBroadcast(servers);
    testcase.api.connect().then(() => {
      testcase.api.once('ledger', () => resolve());
      testcase.mocks[0].socket.send(JSON.stringify(ledgerClosed));
    }).catch(reject);
  });
}

function setup() {
  return getFreePort().then(port => {
    return setupMockChainsqldConnection(this, port);
  });
}

function setupBroadcast() {
  return Promise.all([getFreePort(), getFreePort()]).then(ports => {
    return setupMockChainsqldConnectionForBroadcast(this, ports);
  });
}

function teardown(done) {
  this.api.disconnect().then(() => {
    if (this.mockChainsqld !== undefined) {
      this.mockChainsqld.close();
    } else {
      this.mocks.forEach(mock => mock.close());
    }
    setImmediate(done);
  }).catch(done);
}

module.exports = {
  setup: setup,
  teardown: teardown,
  setupBroadcast: setupBroadcast,
  createMockChainsqld: createMockChainsqld
};
