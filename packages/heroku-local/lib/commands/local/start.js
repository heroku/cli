'use strict';
let Forego  = require('../../forego');

function handleErr (err) {
  console.error(err.stack);
  process.exit(1);
}

module.exports = {
  topic: 'local',
  command: 'start',
  description: 'run heroku app locally',
  help: `Start the application specified by a Procfile (defaults to ./Procfile)

Examples:

  heroku local:start
  heroku local:start web
  heroku local:start -f Procfile.test -e .env.test`,
  args: [{name: 'processname', optional: true}],
  flags: [
    {name: 'procfile', char: 'f', hasValue: true},
    {name: 'env', char: 'e', hasValue: true},
    {name: 'concurrency', char: 'c', hasValue: true},
    {name: 'port', char: 'p', hasValue: true},
    {name: 'r', char: 'r', hasValue: false}
  ],
  run: function (ctx) {
    let forego = new Forego(ctx.herokuDir);
    forego.ensureSetup(function (err) {
      if (err) { handleErr(err); }
      forego.start({cwd: ctx.cwd, args: ctx.args});
    });
  }
};
