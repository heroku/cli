var url = require('url');
var Heroku = require('heroku-client');
var redis = require('redis');
var readline = require('readline');

function cli (redis) {
  var io = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  io.prompt();

  redis.on('quit', function () {
    io.close();
  });

  io.on('line', function (line) {
    line = line.split(' ');
    redis.send_command(line[0], line.slice(1), function (err, val) {
      if (err) { throw err; }
      console.log(val);
      io.prompt();
    });
  });
}

module.exports = {
  topic: 'redis',
  command: 'cli',
  needsApp: true,
  needsAuth: true,
  shortHelp: 'opens a redis prompt',
  run: function(context) {
    var heroku = new Heroku({token: context.auth.password});
    heroku.apps(context.app).configVars().info()
    .then(function (configVars) { return configVars.REDIS_URL; })
    .then(url.parse)
    .then(function (url) {
      return redis.createClient(url.port, url.hostname, {
        auth_pass: url.auth.split(':')[1]
      });
    })
    .then(cli)
    .done();
  }
};
