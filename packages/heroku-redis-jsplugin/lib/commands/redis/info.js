var url = require('url');
var Heroku = require('heroku-client');
var redis = require('redis');
var Q = require('q');


var HOST = "redis-api.heroku.com";
var PATH=  "/redis/v0/databases";

function request(context, path, callback) {
  return Heroku.request( {
    method:"GET",
    path: PATH+"/"+path,
    host: HOST,
    auth: context.auth.username+":"+context.auth.password,
    headers: {
      'Accept': 'application/json',
    },
  },callback);
}
module.exports = {
  topic: 'redis',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  shortHelp: 'gets information about redis',
  run: function(context) {
    var conn;
    var heroku = new Heroku({token: context.auth.password});
    heroku.apps(context.app).addons().list()
    .then(function (addons) {
      var redis_addons = [];
      for (var i=0; i < addons.length; i++) {
        var addon = addons[i];
        var service = addon.addon_service.name

        if (service.indexOf('heroku-redis') == 0) {
          redis_addons.push(addon)
        }
      }
      return redis_addons
    })
    .then(function(addons) {
      var out = []

      for(var i=0; i<addons.length; i++) {
        var addon = addons[i];
        var path = addons[i].name
        var r = request(context, path, function (addon, err, body) {
            console.log("===",addon.config_vars[0]);
            var info = body.info;
            var width = 0;
            for (var i=0; i < info.length; i++) {
              width = Math.max(width, info[i].name.length)
            }
            for (var i=0; i < info.length; i++) {
              padding = ": "+Array(width-info[i].name.length+1).join(" ");
              console.log(info[i].name+padding+info[i].values.join(" "));
            }
          }.bind(this, addon)
        );
        out.push(r);
      }
      return Q.allSettled(out)
    }) .done();
  }
};
