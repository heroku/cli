'use strict';

let co  = require('co');
let cli = require('heroku-cli-util');

function* run (context, heroku) {
  let clients = yield heroku.request({
    path: '/oauth/clients',
    headers: {Accept: 'application/json'}
  });
  if (context.flags.json) {
    cli.log(JSON.stringify(clients, null, 2));
  } else if (clients.length === 0) {
    cli.log('No oauth clients.');
  } else {
    cli.debug(clients);
  }
}

module.exports = {
  topic: 'clients',
  description: 'list your OAuth clients',
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
};
