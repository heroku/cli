'use strict';

let co      = require('co');
let tls     = require('tls');
let url     = require('url');
let tty     = require('tty');
let stream  = require('stream');
let cli     = require('heroku-cli-util');
let helpers = require('../lib/helpers');

function env (flag) {
  let c = flag ? helpers.buildEnvFromFlag(flag) : {};
  c.TERM = process.env.TERM;
  if (tty.isatty(1)) {
    c.COLUMNS = process.stdout.columns;
    c.LINES   = process.stdout.rows;
  }
  return c;
}

let warning;
function startDyno(heroku, app, size, command, envFlag) {
  return heroku.request({
    path: `/apps/${app}/dynos`,
    method: 'POST',
    middleware: (res, cb) => {warning = res.headers['warning-message']; cb();},
    body: {
      command:  command,
      attach:   true,
      size:     size,
      env:      env(envFlag),
    }
  });
}

function readStdin(c) {
  let stdin = process.stdin;
  stdin.setEncoding('utf8');
  if (tty.isatty(0)) {
    stdin.setRawMode(true);
    stdin.pipe(c);
    let sigints = [];
    stdin.on('data', function (c) {
      if (c === '\u0003') sigints.push(new Date());
      sigints = sigints.filter(d => d > new Date() - 1000);
      if (sigints.length >= 4) {
        cli.error('forcing dyno disconnect');
        process.exit(1);
      }
    });
  } else {
    stdin.pipe(new stream.Transform({
      objectMode: true,
      transform: function (chunk, _, next) {
        c.write(chunk, next);
      },
      flush: function (done) {
        // TODO: this sends the EOF signal to rendezvous
        // too early if the stdin input is large
        // ideally rendezvous could wait to receive input
        // while it is processing
        c.write("\x04", done);
      }
    }));
  }
}

function readData(c) {
  let firstLine = true;
  return function (data) {
    // discard first line
    if (firstLine) {
      firstLine = false;
      readStdin(c);
      return;
    }
    data = data.replace('\r\n', '\n');
    let exitCode = data.match(/heroku-command-exit-status (\d+)/m);
    if (exitCode) {
      process.stdout.write(data.replace(/^heroku-command-exit-status \d+$\n?/m, ''));
      process.exit(exitCode[1]);
    }
    process.stdout.write(data);
  };
}

function attachToRendezvous(uri, opts) {
  let c = tls.connect(uri.port, uri.hostname, {rejectUnauthorized: opts.rejectUnauthorized});
  c.setTimeout(1000*60*20);
  c.setEncoding('utf8');
  c.on('connect', function () {
    c.write(uri.path.substr(1) + '\r\n', function () {
      console.error(` up, ${opts.dyno.name}`);
    });
  });
  c.on('data', readData(c));
  c.on('close', () => process.exit(opts.exitCode));
  c.on('error', cli.errorHandler());
  process.once('SIGINT', function () {
    c.end();
  });
}

function* run (context, heroku) {
  let command = helpers.buildCommand(context.args);
  if (!command) {
    cli.error('Usage: heroku run COMMAND\n\nExample: heroku run bash');
    process.exit(1);
  }
  let sh = context.flags['exit-code'] ? `${command}; echo heroku-command-exit-status $?` : command;
  process.stderr.write(`Running ${cli.color.cyan.bold(command)} on ${context.app}...`);
  let dyno = yield startDyno(heroku, context.app, context.flags.size, sh, context.flags.env);
  if (warning) {
    cli.console.error(cli.color.bold.yellow('!'));
    cli.warn(warning);
    cli.console.writeError('Connecting to dyno...');
  } else {
    cli.console.writeError('.');
  }
  attachToRendezvous(url.parse(dyno.attach_url), {
    exitCode: context.flags['exit-code'] ? -1 : 0, // exit with -1 if the stream ends and heroku-command-exit-status is empty
    rejectUnauthorized: heroku.options.rejectUnauthorized,
    dyno: dyno,
  });
}

module.exports = {
  topic: 'run',
  description: 'run a one-off process inside a heroku dyno',
  help: `
Examples:

  $ heroku run bash
  Running bash on app.... up, run.1
  ~ $

  $ heroku run -s hobby -- myscript.sh -a arg1 -s arg2
  Running myscript.sh -a arg1 -s arg2 on app.... up, run.1
`,
  variableArgs: true,
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'size', char: 's', description: 'dyno size', hasValue: true},
    {name: 'exit-code', description: 'passthrough the exit code of the remote command'},
    {name: 'env', description: "environment variables to set (use ';' to split multiple vars)", hasValue: true},
  ],
  run: cli.command(co.wrap(run))
};
