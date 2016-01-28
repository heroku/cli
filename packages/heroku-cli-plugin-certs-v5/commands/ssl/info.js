'use strict';

let co      = require('co');
let cli     = require('heroku-cli-util');
let certificate_details = require('../../lib/certificate_details.js');

function* run(context, heroku) {
  var name = context.args.name;

  let cert = yield cli.action(`Fetching SSL Endpoint ${name} info for ${context.app}...`, {}, heroku.request({
    path: `/apps/${context.app}/sni-endpoints/${name}`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
  }));

  certificate_details(cert);
}

module.exports = {
  topic: '_ssl',
  command: 'info',
  args: [
    {name: 'name', optional: false}
  ],
  description: 'Show certificate information for an ssl endpoint.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
};
