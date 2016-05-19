'use strict';

let cli           = require('heroku-cli-util');
let co            = require('co');
let extend        = require('util')._extend;

function* run(context, heroku) {
  let appName = context.app;
  let request = heroku.delete(`/apps/${appName}/collaborators/${context.args.email}`);
  yield cli.action(`Removing ${cli.color.cyan(context.args.email)} access from the app ${cli.color.magenta(appName)}`, request);
}

let cmd = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'remove',
  description: 'Remove users from your app',
  help: 'heroku access:remove user@email.com --app APP',
  args: [{name: 'email', optional: false}],
  run: cli.command(co.wrap(run))
};

module.exports = cmd;
module.exports.sharing = extend({}, cmd);
module.exports.sharing.hidden = true;
module.exports.sharing.topic = 'sharing';
module.exports.sharing.run = function () {
  cli.error(`This command is now ${cli.color.cyan('heroku access:remove')}`);  process.exit(1);
};
