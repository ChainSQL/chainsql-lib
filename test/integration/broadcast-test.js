'use strict';
const {ChainsqlAPIBroadcast} = require('../../src');

function main() {
  const servers = ['wss://s1.ripple.com', 'wss://s2.ripple.com'];
  const api = new ChainsqlAPIBroadcast(servers);
  api.connect().then(() => {
    api.getServerInfo().then(info => {
      console.log(JSON.stringify(info, null, 2));
    });
    api.on('ledger', ledger => {
      console.log(JSON.stringify(ledger, null, 2));
    });
  });
}

main();
