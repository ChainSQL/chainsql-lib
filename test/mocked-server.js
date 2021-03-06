'use strict';


const port = 34371;

const createMockChainsqld = require('./mock-rippled');

function main() {
  if (global.describe) {
    // we are running inside mocha, exiting
    return;
  }
  console.log('starting server on port ' + port);
  createMockChainsqld(port);
  console.log('starting server on port ' + String(port + 1));
  createMockChainsqld(port + 1);
}

main();
