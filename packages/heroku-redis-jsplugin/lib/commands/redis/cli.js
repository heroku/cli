var url = require('url');
var Heroku = require('heroku-client');
var readline = require('readline');
var net = require('net');

// TODO: print using this protocol http://redis.io/topics/protocol
function startsWith (a, b) {
  return a.indexOf(b) === -1;
}

function cli (url) {
  var io = readline.createInterface(process.stdin, process.stdout);
  io.setPrompt(url.host + '> ');
  var client = net.connect({port: url.port, host: url.hostname}, function () {
    client.write('AUTH ' + url.auth.split(':')[1] + '\n', function () {
      io.prompt();
    });
  });
  io.on('line', function (line) {
    client.write(line + '\n');
  });
  io.on('close', function () {
    console.log();
    client.write('quit\n');
  });
  client.on('data', function (data) {
    process.stdout.write(data.toString());
    io.prompt();
  });
  client.on('end', function () {
    console.log('disconnected from server');
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
    .then(function (config) {
      var url = config.REDIS_URL;
      if (!url) {
        console.error('App does not have REDIS_URL');
        process.exit(1);
      }
      return url;
    })
    .then(url.parse)
    .then(cli);
  }
};
