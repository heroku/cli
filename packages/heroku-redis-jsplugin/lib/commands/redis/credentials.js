var Heroku = require('heroku-client');

var api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'credentials',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: false}],
  flags: [{name: 'reset', char: 'r'}],
  shortHelp: 'display credentials information',
  run: function(context) {
    var heroku = new Heroku({token: context.auth.password});

    if (context.args.reset) {
      var addonsFilter = api.make_addons_filter(context.args.database);
      heroku.apps(context.app).addons().list()
        .then(addonsFilter)
        .then(function (addons) {
          if (addons.length === 0) {
            console.error('No redis databases found');
            process.exit(1);
          } else {
            var addon = addons[0];
            api.request(context, addon.name + '/credentials_rotation', 'POST')
              .done(function() {
                console.log('Resetting credentials for ' + addon.name);
              });
          }
        })
        .done();
    } else {
      var varFilter = api.make_config_var_filter(context.args.database);
      heroku.apps(context.app).configVars().info()
        .then(varFilter)
        .then(function (addons) {
          if (addons.length === 0) {
            console.error('No redis databases found');
            process.exit(1);
          } else {
            console.log(addons[0].url);
          }
        })
        .done();
    }
  }
};
