'use strict';

var Heroku      = require('heroku-client');
var co          = require('co');
var heroku;

module.exports = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'remove',
  description: 'Remove users from your app',
  help: 'heroku access:remove user@email.com --app APP',
  args: [{name: 'user', optional: false}],

  run: function (context) {
    let appName;

    appName = context.app;

    co(function* () {
      heroku = new Heroku({token: context.auth.password});
      yield heroku.apps(appName).collaborators(context.args.user).delete(function (err) {
        if (err) { throw err; }
        console.log(`Removing ${context.args.user} from application ${appName}...done`);
      });
    }).catch(function (err) {
      console.error(err);
    });
  }
};

