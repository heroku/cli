'use strict';

let co      = require('co');
let tls     = require('tls');
let url     = require('url');
let tty     = require('tty');
let stream  = require('stream');
let cli     = require('heroku-cli-util');
let helpers = require('../lib/helpers');

class Run {
  run (context, heroku) {
    return co(function* () {
      this.heroku = heroku;
      this.app = context.app;
      this.command = helpers.buildCommand(context.args);
      this.flags = context.flags;
      if (!this.command) throw new Error('Usage: heroku run COMMAND\n\nExample: heroku run bash');

      this.dyno = yield this.startDyno();
      this.updateStatus('starting');

      this.attachToRendezvous();
    }.bind(this));
  }

  env () {
    let c = this.flags.env ? helpers.buildEnvFromFlag(this.flags.env) : {};
    c.TERM = process.env.TERM;
    if (tty.isatty(1)) {
      c.COLUMNS = process.stdout.columns;
      c.LINES   = process.stdout.rows;
    }
    return c;
  }

  updateStatus (status, stop) {
    let msg = `Running ${cli.color.cyan.bold(this.command)} on ${this.app}... `;
    if (status) msg += `${cli.color.blue(status)}, ${this.dyno.name}`;
    if (!this.spinner) {
      this.spinner = new cli.Spinner({text: msg});
      this.spinner.start();
    }
    else this.spinner.update(msg);
    if (stop) {
      this.spinner.stop();
      cli.console.error();
    }
  }

  startDyno () {
    let command = this.flags['exit-code'] ? `${this.command}; echo heroku-command-exit-status $?` : this.command;
    return this.heroku.request({
      path: `/apps/${this.app}/dynos`,
      method: 'POST',
      body: {
        command:  command,
        attach:   true,
        size:     this.flags.size,
        env:      this.env(),
      }
    });
  }

  attachToRendezvous() {
    let uri = url.parse(this.dyno.attach_url);
    let c = tls.connect(uri.port, uri.hostname, {rejectUnauthorized: this.heroku.options.rejectUnauthorized});
    c.setTimeout(1000*60*20);
    c.setEncoding('utf8');
    c.on('connect', () => {
      c.write(uri.path.substr(1) + '\r\n', () => this.updateStatus('connecting'));
    });
    c.on('data', this.readData(c));
    c.on('close', () => process.exit(this.flags['exit-code'] ? -1 : 0));
    c.on('error', cli.errorHandler());
    process.once('SIGINT', () => c.end());
  }

  readData (c) {
    let firstLine = true;
    return data => {
      // discard first line
      if (firstLine) {
        this.updateStatus('up', true);
        firstLine = false;
        this.readStdin(c);
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

  readStdin (c) {
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
  run: cli.command((context, heroku) => (new Run()).run(context, heroku))
};
