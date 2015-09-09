'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let net = require('net');
let parser = require('./parser.js');
let readline = require('readline');
let spawn = require('child_process').spawn;
let tls = require('tls');
let url = require('url');

const REPLY_OK = 'OK';

function nativeCLI(redis) {
  let io = readline.createInterface(process.stdin, process.stdout);
  let reply = new parser();
  let status = 'normal';
  let uri = url.parse(redis.resource_url);
  let client;

  io.setPrompt(uri.host + '> ');

  if (redis.plan.indexOf('hobby') == 0) {
    client = net.connect({port: uri.port, host: uri.hostname}, function () {
      client.write(`AUTH ${uri.auth.split(':')[1]}\n`);
    });
  } else {
    client = tls.connect({port: parseInt(uri.port, 10) + 1, host: uri.hostname, rejectUnauthorized: false}, function () {
      client.write(`AUTH ${uri.auth.split(':')[1]}\n`);
    });
  }

  reply.on('reply', function (reply) {
    switch (status) {
    case 'monitoring':
      if (reply !== REPLY_OK) {
        console.log(reply);
      }
      break;
    case 'subscriber':
      if (Array.isArray(reply)) {
        reply.forEach(function (value, i) {
          console.log(`${i+1}) ${value}`);
        });
      } else {
        console.log(reply);
      }
      break;
    default:
      if (Array.isArray(reply)) {
        reply.forEach(function (value, i) {
          console.log(`${i+1}) ${value}`);
        });
      } else {
        console.log(reply);
      }
      io.prompt();
      break;
    }
  });
  reply.on('reply error', function (reply) {
    console.log(reply.message);
    io.prompt();
  });
  reply.on('error', function (err) {
    client.emit('error', err);
  });
  io.on('line', function (line) {
    switch (line.split(' ')[0]) {
    case 'MONITOR':
      status = 'monitoring';
      break;
    case 'PSUBSCRIBE':
    case 'SUBSCRIBE':
      status = 'subscriber';
      break;
    }
    client.write(`${line}\n`);
  });
  io.on('close', function () {
    console.log();
    client.write('QUIT\n');
  });
  client.on('data', function (data) {
    reply.execute(data);
  });
  client.on('error', function(error) {
    cli.error(error);
    process.exit(1);
  });
  client.on('end', function () {
    console.log('\nDisconnected from instance.');
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
  flags: [
    {name: 'confirm', char: 'c', hasValue: true},
    {name: 'builtin'}
  ],
  run: cli.command(function* (context, heroku) {
    yield cli.confirmApp(context.app, context.flags.confirm, 'WARNING: Insecure action.\nAll data, including the Redis password, will not be encrypted.');
    let addonsFilter = api.make_addons_filter(context.args.database);
    let addonsList = heroku.apps(context.app).addons().listByApp();
    let addons = addonsFilter(yield addonsList);
    if (addons.length === 0) {
      cli.error('No Redis instances found.');
      process.exit(1);
    } else if (addons.length > 1) {
      let names = addons.map(function (addon) { return addon.name; });
      cli.error(`Please specify a single instance. Found: ${names.join(', ')}`);
      process.exit(1);
    }

    let addon = addons[0];
    let redis = yield api.request(context, addon.name);

    console.log(`Connecting to ${addon.name} (${addon.config_vars.join(', ')}):`);
    if (context.flags.builtin) {
      nativeCLI(redis);
    } else {
      let uri = url.parse(redis.resource_url);
      let s = spawn('redis-cli', ['-h', uri.hostname, '-p', uri.port, '-a', uri.auth.split(':')[1]], {
        stdio: [0, 1, 2]
      });
      s.on('error', function () {
        nativeCLI(redis);
      });
    }
  })
};
