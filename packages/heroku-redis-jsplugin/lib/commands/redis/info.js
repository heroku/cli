var url = require('url');
var Heroku = require('heroku-client');
var redis = require('redis');
var Q = require('q');

module.exports = {
  topic: 'redis',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  shortHelp: 'gets information about redis',
  run: function(context) {
    var conn;
    var heroku = new Heroku({token: context.auth.password});
    heroku.apps(context.app).configVars().info()
    .then(function (configVars) {
      var url = configVars.REDIS_URL;
      if (!url) {
        console.error('App does not have REDIS_URL');
        process.exit(1);
      }
      return url;
    })
    .then(url.parse)
    .then(function (url) {
      conn = redis.createClient(url.port, url.hostname, {
        auth_pass: url.auth.split(':')[1]
      });
    })
    .then(function () {
      return Q.ninvoke(conn, "info");
    })
    .then(console.log)
    .then(function () {
      return Q.ninvoke(conn, "quit");
    })
    .done();
  }
};
