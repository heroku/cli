'use strict';

let co      = require('co');
let cli     = require('heroku-cli-util');

let flags               = require('../../lib/flags.js');
let certificate_details = require('../../lib/certificate_details.js');

function* run(context, heroku) {
  let endpoint = yield flags(context, heroku);

  let cert = yield cli.action(`Fetching SSL certificate ${endpoint.name} info for ${context.app}`, {}, heroku.request({
    path: endpoint._meta.path,
    headers: {'Accept': `application/vnd.heroku+json; version=3.${endpoint._meta.variant}`}
  }));

  certificate_details(cert);
}

module.exports = {
  topic: '_certs',
  command: 'info',
  flags: [
    {name: 'name', hasValue: true, description: 'name to check info on'}, 
    {name: 'endpoint', hasValue: true, description: 'endpoint to check info on'}
  ],
  description: 'Show certificate information for an SSL certificate.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
};
