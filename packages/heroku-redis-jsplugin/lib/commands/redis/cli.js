'use strict';
let url = require('url');
let readline = require('readline');
let net = require('net');
let spawn = require('child_process').spawn;
let cli = require('heroku-cli-util');
let api = require('./shared.js');

function nativeCLI(url) {
  let io = readline.createInterface(process.stdin, process.stdout);
  io.setPrompt(url.host + '> ');
  let client = net.connect({port: url.port, host: url.hostname}, function () {
    client.write(`AUTH ${url.auth.split(':')[1]}\n`, function () {
      io.prompt();
    });
  });
  io.on('line', function (line) {
    client.write(`${line}\n`);
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
  run: cli.command(function* (context, heroku) {
    yield cli.confirmApp(context.app, context.flags.confirm, 'WARNING: Insecure Action\nAll data, including the redis password, will be unencrypted.');
    let addonsFilter = api.make_addons_filter(context.args.database);
    let addonsList = heroku.apps(context.app).addons().list();
    let addons = addonsFilter(yield addonsList);
    if (addons.length === 0) {
      cli.error('No redis databases found');
      process.exit(1);
    } else if (addons.length > 1) {
      let names = addons.map(function (addon) { return addon.name; });
      cli.error(`Please specify a single database. Found: ${names.join(', ')}`);
      process.exit(1);
    }
    let addon = addons[0];
    let redis = yield api.request(context, addon.name);
    let redisUrl = url.parse(redis.resource_url);
    console.log(`Connecting to ${addon.name} (${addon.config_vars.join(', ')}):`);
    let s = spawn('redis-cli', ['-h', redisUrl.hostname, '-p', redisUrl.port, '-a', redisUrl.auth.split(':')[1]], {
      stdio: [0, 1, 2]
    });
    s.on('error', function () {
      nativeCLI(redisUrl);
    });
  })
};
