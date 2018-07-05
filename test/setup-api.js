'use strict'; // eslint-disable-line 

const DacAPI = require('ripple-api').DacAPI;
const DacAPIBroadcast = require('ripple-api').DacAPIBroadcast;
const ledgerClosed = require('./fixtures/rippled/ledger-close');
const createMockDacd = require('./mock-rippled');
const {getFreePort} = require('./utils/net-utils');


function setupMockDacdConnection(testcase, port) {
  return new Promise((resolve, reject) => {
    testcase.mockDacd = createMockDacd(port);
    testcase._mockedServerPort = port;
    testcase.api = new DacAPI({server: 'ws://localhost:' + port});
    testcase.api.connect().then(() => {
      testcase.api.once('ledger', () => resolve());
      testcase.api.connection._ws.emit('message', JSON.stringify(ledgerClosed));
    }).catch(reject);
  });
}

function setupMockDacdConnectionForBroadcast(testcase, ports) {
  return new Promise((resolve, reject) => {
    const servers = ports.map(port => 'ws://localhost:' + port);
    testcase.mocks = ports.map(port => createMockDacd(port));
    testcase.api = new DacAPIBroadcast(servers);
    testcase.api.connect().then(() => {
      testcase.api.once('ledger', () => resolve());
      testcase.mocks[0].socket.send(JSON.stringify(ledgerClosed));
    }).catch(reject);
  });
}

function setup() {
  return getFreePort().then(port => {
    return setupMockDacdConnection(this, port);
  });
}

function setupBroadcast() {
  return Promise.all([getFreePort(), getFreePort()]).then(ports => {
    return setupMockDacdConnectionForBroadcast(this, ports);
  });
}

function teardown(done) {
  this.api.disconnect().then(() => {
    if (this.mockDacd !== undefined) {
      this.mockDacd.close();
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
  createMockDacd: createMockDacd
};
