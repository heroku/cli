var url = require('url');
var Heroku = require('heroku-client');
var readline = require('readline');
var net = require('net');

var api = require('./shared.js')

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
  args: [{name: 'database', optional: true}],
  run: function(context) {
    var heroku = new Heroku({token: context.auth.password});
    var filter = api.make_config_var_filter(context.args.database)
    heroku.apps(context.app).configVars().info()
    .then(filter)
    .then(function (servers) {
      if (servers.length == 0) {
        console.error('No redis servers found')
        process.exit(1);
      } else if (servers.length > 1) {
        var names = []
        for (var i=0; i<servers.length; i++) {
          names.push(servers[i].name);
        }
        console.error('Please specify a single server. Found: '+names.join(', '))
        process.exit(1);
      }
      var name = servers[0].name;
      var url = servers[0].url
      console.log('Connecting to: '+name)
      return url;
    })
    .then(url.parse)
    .then(cli);
  }
};
