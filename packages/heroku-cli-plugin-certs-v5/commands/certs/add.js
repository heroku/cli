'use strict';

let readFile = require('../../lib/read_file.js');
let co      = require('co');
let cli     = require('heroku-cli-util');
let certificate_details = require('../../lib/certificate_details.js');
let ssl_doctor = require('../../lib/ssl_doctor.js');
let display_warnings = require('../../lib/display_warnings.js');

function* run(context, heroku) {
  var files = yield {
    crt: readFile(context.args.CRT),
    key: readFile(context.args.KEY)
  };

  var crt, key;
  if (context.flags.bypass) {
    crt = files.crt;
    key = files.key;
  } else {
    let res = JSON.parse(yield ssl_doctor('resolve-chain-and-key', [files.crt, files.key]));
    crt = res.pem;
    key = res.key;
  }

  let cert = yield cli.action(`Adding SSL Endpoint to ${context.app}`, {}, heroku.request({
    path: `/apps/${context.app}/sni-endpoints`,
    method: 'POST',
    body: {certificate_chain: crt, private_key: key, app: context.app},
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
  }));

  display_warnings(cert);
  cli.log(`${context.app} now served by ${cert.cname}`);

  certificate_details(cert);
}

module.exports = {
  topic: '_certs',
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
