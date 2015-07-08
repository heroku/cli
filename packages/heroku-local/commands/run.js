'use strict';

let Forego  = require('../lib/forego');
let cli     = require('heroku-cli-util');

function* run (context) {
  if (context.args.length < 1) {
    cli.error('Usage: heroku local:run [COMMAND]\nMust specify command to run');
    process.exit(-1);
  }
  let forego = new Forego(context.herokuDir);
  yield forego.ensureSetup();
  forego.run(context.args, {flags: context.flags});
}

module.exports = {
  topic: 'local',
  command: 'run',
  description: 'run a one-off command',
  help: `Example:

  heroku local:run bin/migrate`,
  variableArgs: true,
  flags: [
    {name: 'env', char: 'e', hasValue: true},
    {name: 'port', char: 'p', hasValue: true}
  ],
  run: cli.command(run)
};
