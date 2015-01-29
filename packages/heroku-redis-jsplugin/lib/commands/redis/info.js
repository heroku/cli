var columnify = require('columnify');
var Heroku = require('heroku-client');
var Q = require('q');

var api = require('./shared.js');

function getAddonInfo (context, addon) {
  var deferred = Q.defer();
  api.request(context, addon.name).then(function (info) {
    deferred.resolve({addon: addon, info: info});
  });
  return deferred.promise;
}

module.exports = {
  topic: 'redis',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  shortHelp: 'gets information about redis',
  run: function(context) {
    var filter = api.make_addons_filter(context.args.database);
    var heroku = new Heroku({token: context.auth.password});

    heroku.apps(context.app).addons().list()
    .then(filter)
    .then(function(addons) {
      return Q.all(addons.map(function (addon) {
        return getAddonInfo(context, addon);
      }));
    })
    .then(function (addons) {
      addons.forEach(function (addon) {
        console.log("=== " + addon.addon.config_vars[0]);
        console.log(columnify(addon.info.info, { showHeaders: false }));
      });
    })
    .done();
  }
};
