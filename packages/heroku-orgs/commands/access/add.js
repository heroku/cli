'use strict';

var Heroku      = require('heroku-client');
var Utils       = require('../../lib/utils');
var co          = require('co');
var heroku;

function printOutput(user, app, privileges) {
  let message = `Adding ${user} to application ${app}`;

  if (privileges){
    message += ` with ${privileges} privileges`;
  }

  message += `... done`;
  console.log(message);
}

module.exports = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'add',
  description: 'Add new users to your app using specific privileges',
  help: 'heroku access:add user@email.com --app APP # Add a collaborator to your app\n\n! BETA: heroku access:add user@email.com --app APP --privileges view, deploy, manage, operate # privileges must be comma separated\n! If you want more information about Heroku Enterprise, please contact sales@heroku.com',
  args: [{name: 'user', optional: false}],
  flags: [
    {name: 'privileges', description: 'list of privileges comma separated', hasValue: true, optional: true}
  ],

  run: function (context) {
    let appName;
    let privileges = context.flags.privileges;

    appName = context.app;

    co(function* () {
      heroku = new Heroku({token: context.auth.password});
      let appInfo = yield heroku.apps(appName).info();

      // Move most of this logic to Utils
      if (Utils.isOrgApp(appInfo.owner.email)) {
        heroku.request({
          method: 'POST',
          path: `/organizations/apps/${appName}/collaborators`,
          headers: {
            'accept': 'application/vnd.heroku+json; version=3.org-privileges',
          },
          body: {
            user: context.args.user,
            privileges: privileges.split(",")
          }
        }, function(err) {
          if (err) { throw err; }
          printOutput(context.args.user, appName, privileges);
        });
      } else {
        heroku.apps(appName).collaborators().create({ user: context.args.user }, function (err) {
          if (err) { throw err; }
          printOutput(context.args.user, appName);
        });
      }

    }).catch(function (err) {
      console.error(err);
    });
  }
};

