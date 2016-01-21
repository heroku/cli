'use strict';

let co  = require('co');
let cli = require('heroku-cli-util');

function* run (context, heroku) {
  let clients = yield heroku.request({
    path: '/oauth/clients',
    headers: {Range: null},
  });
  if (context.flags.json) {
    cli.log(JSON.stringify(clients, null, 2));
  } else if (clients.length === 0) {
    cli.log('No oauth clients.');
  } else {
    cli.table(clients, {
      columns: [
        {key: 'name'},
        {key: 'id'},
        {key: 'redirect_uri'},
      ]
    });
  }
}

module.exports = {
  topic: 'clients',
  description: 'list your OAuth clients',
  needsAuth: true,
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
};
