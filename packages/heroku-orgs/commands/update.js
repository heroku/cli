'use strict';

var Heroku      = require('heroku-client');
var Utils       = require('../lib/utils');
var co          = require('co');
var heroku;

module.exports = {
  topic: 'access',
  needsAuth: true,
  needsApp: true,
  command: 'update',
  description: 'Update existing collaborators',
  help: '! BETA: heroku access:update user@email.com --app APP --privileges view,deploy,manage,operate # privileges must be comma separated\n! If you want more information about Heroku Enterprise, please contact sales@heroku.com',
  args: [{name: 'user', optional: false}],
  flags: [
    {name: 'app', char: 'a', description: 'app you want to add the user', hasValue: true},
    {name: 'privileges', description: 'list of privileges comma separated', hasValue: true, optional: false}
  ],

  run: function (context) {
    let appName;
    let privileges = context.args.privileges;

    appName = context.app;

    co(function* () {
      heroku = new Heroku({token: context.auth.password});
      let appInfo = yield heroku.apps(appName).info();

      if (Utils.isOrgApp(appInfo.owner.email) && privileges) {
        heroku.request({
          method: 'PATCH',
          path: `/organizations/apps/${appName}/collaborators/${context.args.user}`,
          headers: {
            'accept': 'application/vnd.heroku+json; version=3.org-privileges',
          },
          body: {
            privileges: privileges.split(",")
          }
        }, function(err) {
          if (err) { console.error(err); }
          console.log(`Updating ${context.args.user} in application ${appName} with ${privileges} privileges... done`);
        });
      }

    }).catch(function (err) {
      console.error(err);
    });
  }
};
