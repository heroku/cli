'use strict';

let co      = require('co');
let cli     = require('heroku-cli-util');

let error      = require('../../lib/error.js');
let readFile   = require('../../lib/read_file.js');
let ssl_doctor = require('../../lib/ssl_doctor.js');

function* run(context) {
  if (context.args.length === 0) {
    error.exit(1, 'Usage: heroku certs:chain CRT [CRT ...]\nMust specify at least one certificate file.');
  }

  let res = yield context.args.map(function(arg) { return readFile(arg); });

  let body = yield ssl_doctor('resolve-chain', res);
  cli.console.writeLog(body);
}

module.exports = {
  topic: '_certs',
  command: 'chain',
  description: 'Print the ordered and complete chain for the given certificate.',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(run)),
};
