'use strict';
let tls = require('tls');
let url = require('url');
let tty = require('tty');
let Heroku = require('heroku-client');
let co = require('co');
let errors = require('./errors');
let term = require('./term');
let heroku;

function startDyno(app, command) {
  return heroku.apps(app).dynos().create({
    command: command,
    attach: true,
    env: tty.isatty(1) ? term.getTermSize() : {}
  });
}

function attachToRendezvous(uri) {
  let c = tls.connect(uri.port, uri.hostname);
  c.setEncoding('utf8');
  process.stdin.setEncoding('utf8');
  c.on('connect', function () {
    c.write(uri.path.substr(1) + '\r\n');
  });
  if (tty.isatty(0)) {
    process.stdin.setRawMode(true);
    process.stdin.pipe(c);
  }
  let firstLine = true;
  c.on('data', function (data) {
    // discard first line
    if (firstLine) { firstLine = false; return; }
    data = data.replace('\r\n', '\n');
    let exitCode = data.match(/^heroku-command-exit-status (\d+)$/m);
    if (exitCode) {
      process.stdout.write(data.replace(/^heroku-command-exit-status \d+$/m, ''));
      process.exit(exitCode[1]);
    }
    process.stdout.write(data);
  });
  c.on('timeout', function () {
    console.error('timed out');
  });
  c.on('end', function () {
    process.exit(0);
  });
}

module.exports = function run (context) {
  co(function* () {
    heroku = new Heroku({token: context.auth.password});
    let command = context.args.join(' ');
    process.stdout.write(`Running \`${command}\` attached to terminal... `);
    command = `${command}; echo heroku-command-exit-status $?`;
    let dyno = yield startDyno(context.app, command);
    console.log(`up, ${dyno.name}`);
    attachToRendezvous(url.parse(dyno.attach_url));
  }).catch(errors.handleErr);
};
