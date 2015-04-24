var Heroku = require('heroku-client');

var api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'credentials',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'reset', char: 'r'}],
  shortHelp: 'display credentials information',
  run: function(context) {
    var heroku = new Heroku({
      token: context.auth.password,
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3.switzerland'
      }
    });
    if (context.args.reset) {
      var addonsFilter = api.make_addons_filter(context.args.database);
      heroku.apps(context.app).addons().list()
        .then(addonsFilter)
        .then(function (addons) {
          if (addons.length === 0) {
            console.error('No redis databases found');
            process.exit(1);
          } else if (addons.length > 1) {
            var names = [];
            for (var i=0; i<addons.length; i++) {
              names.push(addons[i].name);
            }
            console.error('Please specify a single database. Found: ' + names.join(', '));
            process.exit(1);
          }
          var name = addons[0].name;
          console.log('Resetting credentials for ' + name);
          return name;
        })
        .then(function (name) {
          api.request(context, name + '/credentials_rotation', 'POST')
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
