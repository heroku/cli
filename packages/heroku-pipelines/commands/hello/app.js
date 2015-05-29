
'use strict';
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'hello',
  command: 'app',
  description: 'tells you hello',
  help: 'help text for hello:world',
  needsApp: true,
  needsAuth: true,
  run: cli.command(function (context, heroku) {
    return co(function* () {
      let app = yield heroku.apps(context.app).info();
      cli.debug(app);
      let config = yield heroku.apps(context.app).configVars().info();
      cli.debug(config);
    });
  })
};
