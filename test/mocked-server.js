'use strict';


const port = 34371;

const createMockDacd = require('./mock-rippled');

function main() {
  if (global.describe) {
    // we are running inside mocha, exiting
    return;
  }
  console.log('starting server on port ' + port);
  createMockDacd(port);
  console.log('starting server on port ' + String(port + 1));
  createMockDacd(port + 1);
}

main();
