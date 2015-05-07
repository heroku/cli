'use strict';
let tls   = require('tls');
let url   = require('url');
let tty   = require('tty');
let h     = require('heroku-cli-util');
let chalk = require('chalk');

function buildCommand(args) {
  let cmd = '';
  for (let arg of args) {
    if (arg.indexOf(' ') !== -1) {
      arg = `"${arg}"`;
    }
    cmd = cmd + " " + arg;
  }
  return cmd.trim();
}

function env () {
  let c = {};
  if (tty.isatty(1)) {
    c.COLUMNS = process.stdout.columns;
    c.LINES   = process.stdout.rows;
  }
  return c;
}

function startDyno(heroku, app, size, command) {
  return heroku.apps(app).dynos().create({
    command:  command,
    attach:   true,
    size:     size,
    env:      env(),
  });
}

function attachToRendezvous(uri) {
  let c = tls.connect(uri.port, uri.hostname);
  c.setEncoding('utf8');
  process.stdin.setEncoding('utf8');
  c.on('connect', function () {
    c.write(uri.path.substr(1) + '\r\n');
  });
  let firstLine = true;
  c.on('data', function (data) {
    // discard first line
    if (firstLine) {
      firstLine = false;
      if (tty.isatty(0)) {
        process.stdin.setRawMode(true);
        process.stdin.pipe(c);
      }
      return;
    }
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
  c.on('error', h.errorHandler());
  process.on('SIGINT', function () {
    c.end();
  });
}

module.exports = {
  topic: 'run',
  help: `run a one-off process inside a Heroku dyno`,
  variableArgs: true,
  needsAuth: true,
  needsApp: true,
  hidden: true,
  flags: [
    {name: 'size', char: 's', description: 'dyno size', hasValue: true},
    {name: 'exit-code', description: 'placeholder'},
  ],
  run: h.command(function* (context, heroku) {
    let command = buildCommand(context.args);
    if (!command) {
      h.error('Usage: heroku run COMMAND\n\nExample: heroku run bash');
      process.exit(1);
    }
    let p = startDyno(heroku, context.app, context.flags.size, `${command}; echo heroku-command-exit-status $?`);
    let dyno = yield h.action(`Running ${chalk.cyan.bold(command)} attached to terminal`, p, {success: false});
    console.error(`up, ${chalk.cyan.bold(dyno.name)}`);
    attachToRendezvous(url.parse(dyno.attach_url));
  }),
};
