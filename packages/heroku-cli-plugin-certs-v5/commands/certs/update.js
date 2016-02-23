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

  let name = context.args.name;

  let cert = yield cli.action(`Updating SSL Endpoint ${name} for ${context.app}`, {}, heroku.request({
    path: `/apps/${context.app}/sni-endpoints/${name}`,
    method: 'PATCH',
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'},
    body: {certificate_chain: crt, private_key: key}
  }));

  display_warnings(cert);
  certificate_details(cert, 'Updated certificate details:');
}

module.exports = {
  topic: '_certs',
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
