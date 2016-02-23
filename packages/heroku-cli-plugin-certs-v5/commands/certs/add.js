'use strict';

let readFile = require('../../lib/read_file.js');
let co      = require('co');
let cli     = require('heroku-cli-util');
let certificate_details = require('../../lib/certificate_details.js');
let ssl_doctor = require('../../lib/ssl_doctor.js');
let display_warnings = require('../../lib/display_warnings.js');
let endpoints = require('../../lib/endpoints.js');
let error = require('../../lib/error.js');

function* run(context, heroku) {
  var meta;

  if (context.flags.endpoint && context.flags.sni) {
    error.exit(1, 'Must pass just one of --sni or --endpoint');
  } else if (context.flags.endpoint) {
    meta = endpoints.meta(context.app, 'ssl');
  } else if (context.flags.sni || ! (yield endpoints.hasAddon(context.app, heroku))) {
    meta = endpoints.meta(context.app, 'sni');
  } else {
    error.exit(1, 'Must pass either --sni or --endpoint');
  }

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
    path: meta.path,
    method: 'POST',
    body: {certificate_chain: crt, private_key: key},
    headers: {'Accept': `application/vnd.heroku+json; version=3.${meta.variant}`}
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
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false},
    {name: 'sni', description: 'create an SNI cert', hasValue: false},
    {name: 'endpoint', description: 'create an Endpoint cert', hasValue: false}
  ],
  description: 'Add an ssl endpoint to an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run)),
};
