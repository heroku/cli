'use strict';

let co      = require('co');
let cli     = require('heroku-cli-util');
let flags = require('../../lib/flags.js');

function* run(context, heroku) {
  let f = (yield flags(context, heroku));

  let endpoint = f.endpoint;

  yield cli.confirmApp(context.app, context.flags.confirm, `Potentially Destructive Action\nThis command will remove the endpoint ${endpoint.name} (${endpoint.cname}) from ${context.app}.`);

  yield cli.action(`Removing SSL Endpoint ${endpoint.name} (${endpoint.cname}) from ${context.app}`, {}, heroku.request({
    path: endpoint._meta.path,
    method: 'DELETE',
    headers: {'Accept': `application/vnd.heroku+json; version=3.${endpoint._meta.variant}`}
  }));

  if (f.endpoints.ssl_certs.hasAddon) {
    cli.log('NOTE: Billing is still active. Remove SSL Endpoint add-on to stop billing.');
  }
}

module.exports = {
  topic: '_certs',
  command: 'remove',
  flags: [
    {name: 'confirm', hasValue: true, hidden: true },
    {name: 'name', hasValue: true, description: 'name to check info on'}, 
    {name: 'endpoint', hasValue: true, description: 'endpoint to check info on'}
  ],
  description: 'Remove an SSL Endpoint from an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run)),
};
