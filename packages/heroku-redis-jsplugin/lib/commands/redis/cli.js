'use strict';
let url = require('url');
let readline = require('readline');
let net = require('net');
let spawn = require('child_process').spawn;
let h = require('heroku-cli-util');

let api = require('./shared.js');

function cli (url) {
  let io = readline.createInterface(process.stdin, process.stdout);
  io.setPrompt(url.host + '> ');
  let client = net.connect({port: url.port, host: url.hostname}, function () {
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
  description: 'opens a redis prompt',
  args: [{name: 'database', optional: true}],
  flags: [{name: 'confirm', char: 'c', hasValue: true}],
  run: h.command(function* (context, heroku) {
    yield h.confirmApp(context.app, context.flags.confirm, "WARNING: Insecure Action\nAll data, including the redis password, will be unencrypted.");
    let filter = api.make_config_var_filter(context.args.database);
    let addons = filter(yield heroku.apps(context.app).configVars().info());
    if (addons.length === 0) {
      h.error('No redis databases found');
      process.exit(1);
    } else if (addons.length > 1) {
      let names = addons.map(function (addon) { return addon.name; });
      h.error('Please specify a single database. Found: '+names.join(', '));
      process.exit(1);
    }
    let name = addons[0].name;
    let redisUrl = url.parse(addons[0].url);
    console.log('Connecting to: '+name);
    let s = spawn('redis-cli', ['-h', redisUrl.hostname, '-p', redisUrl.port, '-a', redisUrl.auth.split(':')[1]], {
      stdio: [0, 1, 2]
    });
    s.on('error', function () {
      cli(redisUrl);
    });
  })
};
