'use strict';

let co     = require('co');
let tls    = require('tls');
let url    = require('url');
let tty    = require('tty');
let stream = require('stream');
let cli    = require('heroku-cli-util');

function buildCommand(args) {
  if (args.length === 1) {
    // do not add quotes around arguments if there is only one argument
    // `heroku run "rake test"` should work like `heroku run rake test`
    return args[0];
  }
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

function readStdin(c) {
  let stdin = process.stdin;
  stdin.setEncoding('utf8');
  if (tty.isatty(0)) {
    stdin.setRawMode(true);
    stdin.pipe(c);
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
  let c = tls.connect(uri.port, uri.hostname);
  c.setEncoding('utf8');
  c.on('connect', function () {
    c.write(uri.path.substr(1) + '\r\n');
  });
  c.on('data', readData(c));
  c.on('timeout', function () {
    cli.error('timed out');
  });
  c.on('end', function () {
    process.exit(opts.exitCode);
  });
  c.on('error', cli.errorHandler());
  process.once('SIGINT', function () {
    c.end();
  });
}

function* run (context, heroku) {
  let command = buildCommand(context.args);
  if (!command) {
    cli.error('Usage: heroku run COMMAND\n\nExample: heroku run bash');
    process.exit(1);
  }
  let sh = context.flags['exit-code'] ? `${command}; echo heroku-command-exit-status $?` : command;
  cli.debug(context)
  let p = startDyno(heroku, context.app, context.flags.size, sh);
  let dyno = yield cli.action(`Running ${cli.color.cyan.bold(command)} on ${context.app}`, {success: false}, p);
  console.error(`up, ${dyno.name}`);
  attachToRendezvous(url.parse(dyno.attach_url), {
    exitCode: context.flags['exit-code'] ? -1 : 0 // exit with -1 if the stream ends and heroku-command-exit-status is empty
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
  run: cli.command(co.wrap(run))
};
