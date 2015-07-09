'use strict';

let Forego  = require('../lib/forego');
let cli     = require('heroku-cli-util');

function* run (context) {
  let forego = new Forego(context.herokuDir);
  yield forego.ensureSetup();
  forego.start({args: context.args, flags: context.flags});
}

module.exports = {
  topic: 'local',
  command: 'start',
  description: 'run heroku app locally',
  default: true,
  help: `Start the application specified by a Procfile (defaults to ./Procfile)

Examples:

  heroku local
  heroku local web
  heroku local -f Procfile.test -e .env.test`,
  args: [{name: 'processname', optional: true}],
  flags: [
    {name: 'procfile',    char: 'f', hasValue: true,  description: 'use a different Procfile'},
    {name: 'env',         char: 'e', hasValue: true,  description: 'location of env file (defaults to .env)'},
    {name: 'concurrency', char: 'c', hasValue: true,  description: 'number of processes to start'},
    {name: 'port',        char: 'p', hasValue: true,  description: 'port to listen on'},
    {name: 'restart',     char: 'r', hasValue: false, description: 'restart process if it dies'}
  ],
  run: cli.command(run)
};
