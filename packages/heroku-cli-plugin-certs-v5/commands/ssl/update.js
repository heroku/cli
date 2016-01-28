'use strict';

let readFile = require('../../lib/read_file.js');
let co      = require('co');
let cli     = require('heroku-cli-util');
let certificate_details = require('../../lib/certificate_details.js');
let ssl_doctor = require('../../lib/ssl_doctor.js');
let display_warnings = require('../../lib/display_warnings.js');

function* run(context, heroku) {
  let pem_file = context.args.CRT;
  let key_file = context.args.KEY;

  var res = yield {
    pem: readFile(pem_file),
    key: readFile(key_file)
  };

  if (! context.flags.bypass) {
    res = JSON.parse(yield ssl_doctor('resolve-chain-and-key', [res.pem, res.key]));
  }

  let name = context.args.name;

  let cert = yield cli.action(`Updating SSL Endpoint ${name} for ${context.app}`, {}, heroku.request({
    path: `/apps/${context.app}/sni-endpoints/${name}`,
    method: 'PATCH',
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'},
    body: {certificate_chain: res.pem, private_key: res.key}
  }));

  display_warnings(cert);
  certificate_details(cert, 'Updated certificate details:');
}

module.exports = {
  topic: '_ssl',
  command: 'update',
  args: [
    {name: 'name', optional: false},
    {name: 'CRT', optional: false},
    {name: 'KEY', optional: false},
  ],
  flags: [
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false}
  ],
  description: 'Update an SSL Endpoint on an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run)),
};
