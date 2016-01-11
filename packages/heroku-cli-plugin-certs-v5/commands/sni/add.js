'use strict';

let readFile = require('../../lib/read_file.js');
let co      = require('co');
let cli     = require('heroku-cli-util');
let certificate_details = require('../../lib/certificate_details.js');
let ssl_doctor = require('../../lib/ssl_doctor.js');
let display_warnings = require('../../lib/display_warnings.js');

function* run(context, heroku) {
  let cert_file = context.args.CRT;
  let key_file = context.args.KEY;

  var res = yield {
    pem: readFile(cert_file),
    key: readFile(key_file)
  };

  if (! context.flags.bypass) {
    res = JSON.parse(yield ssl_doctor('resolve-chain-and-key', [res.pem, res.key]));
  }

  let cert = yield cli.action(`Adding SSL Endpoint to ${context.app}`, {}, heroku.request({
    path: `/apps/${context.app}/sni-endpoints`,
    method: 'POST',
    body: {certificate_chain: res.pem, private_key: res.key, app: context.app},
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
  }));

  display_warnings(cert);
  cli.log(`${context.app} now served by ${cert.cname}`);

  certificate_details(cert);
}

module.exports = {
  topic: '_sni',
  command: 'add',
  args: [
    {name: 'CRT', optional: false},
    {name: 'KEY', optional: false},
  ],
  flags: [
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false}
  ],
  description: 'Add an ssl endpoint to an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run)),
};
