var url = require('url');
var Heroku = require('heroku-client');
var readline = require('readline');
var net = require('net');
var spawn = require('child_process').spawn;

var api = require('./shared.js');

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
    console.log('disconnected from database');
    process.exit(0);
  });
}

module.exports = {
  topic: 'redis',
  command: 'cli',
  needsApp: true,
  needsAuth: true,
  shortHelp: 'opens a redis prompt',
  args: [{name: 'database', optional: true}],
  run: function(context) {
    var heroku = new Heroku({
      token: context.auth.password,
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3.switzerland'
      }
    });

    var filter = api.make_config_var_filter(context.args.database);
    heroku.apps(context.app).configVars().info()
    .then(filter)
    .then(function (addons) {
      if (addons.length === 0) {
        console.error('No redis databases found');
        process.exit(1);
      } else if (addons.length > 1) {
        var names = [];
        for (var i=0; i<addons.length; i++) {
          names.push(addons[i].name);
        }
        console.error('Please specify a single database. Found: '+names.join(', '));
        process.exit(1);
      }
      var name = addons[0].name;
      var url = addons[0].url;
      console.log('Connecting to: '+name);
      return url;
    })
    .then(url.parse)
    .then(function (url) {
      var s = spawn('redis-cli', ['-h', url.hostname, '-p', url.port, '-a', url.auth.split(':')[1]], {
        stdio: [0, 1, 2]
      });
      s.on('error', function () {
        cli(url);
      });
    });
  }
};
