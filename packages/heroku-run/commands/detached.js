'use strict';

let co           = require('co');
let cli          = require('heroku-cli-util');
let helpers      = require('../lib/helpers');
let logDisplayer = require('../lib/log_displayer');

function startDyno(heroku, app, size, command, envFlag) {
  return heroku.apps(app).dynos().create({
    command:  command,
    attach:   false,
    size:     size,
    env:      envFlag ? helpers.buildEnvFromFlag(envFlag) : {},
  });
}

function* run (context, heroku) {
  let command = helpers.buildCommand(context.args);
  if (!command) {
    cli.error('Usage: heroku run COMMAND\n\nExample: heroku run bash');
    process.exit(1);
  }
  let p = startDyno(heroku, context.app, context.flags.size, command, context.flags.env);
  let dyno = yield cli.action(`Running ${cli.color.cyan.bold(command)} on ${context.app}`, {success: false}, p);
  cli.console.error(` up, ${dyno.name}`);
  if (context.flags.tail) {
    yield logDisplayer(heroku, {
      app:   context.app,
      dyno:  dyno.name,
      tail:  true,
    });
  } else {
    cli.log(`Run ${cli.color.cyan.bold('heroku logs --app ' + dyno.app.name + ' --dyno '+dyno.name)} to view the output.`);
  }
}

module.exports = {
  topic: 'run',
  command: 'detached',
  description: 'run a detached dyno, where output is sent to your logs',
  help: `
Example:

  $ heroku run:detached ls
  Running ls on app [detached]... up, run.1
  Run heroku logs -a app -p run.1 to view the output.
`,
  variableArgs: true,
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'size', char: 's', description: 'dyno size', hasValue: true},
    {name: 'tail', char: 't', description: 'stream logs from the dyno'},
    {name: 'env', description: "environment variables to set (use ';' to split multiple vars)", hasValue: true},
  ],
  run: cli.command(co.wrap(run))
};
