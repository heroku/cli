'use strict';
let Forego  = require('../forego');
let h = require('heroku-cli-util');

module.exports = {
  topic: 'local',
  description: 'run heroku app locally',
  help: `Start the application specified by a Procfile (defaults to ./Procfile)

Examples:

  heroku local
  heroku local web
  heroku local -f Procfile.test -e .env.test`,
  args: [{name: 'processname', optional: true}],
  flags: [
    {name: 'procfile', char: 'f', hasValue: true},
    {name: 'env', char: 'e', hasValue: true},
    {name: 'concurrency', char: 'c', hasValue: true},
    {name: 'port', char: 'p', hasValue: true},
    {name: 'r', char: 'r', hasValue: false}
  ],
  run: h.command(function* (ctx) {
    let forego = new Forego(ctx.herokuDir);
    yield forego.ensureSetup();
    forego.start({args: ctx.args, flags: ctx.flags});
  })
};
