'use strict';
let net = require('net');
let url = require('url');
let Heroku = require('heroku-client');
let co = require('co');
let errors = require('./errors');
let heroku;

function startDyno(app, command) {
  return heroku.apps(app).dynos().create({
    command: command,
    attach: true
  });
}

module.exports = function run (context) {
  co(function* () {
    heroku = new Heroku({token: context.auth.password});
    let command = context.args.join(' ');
    process.stdout.write(`Running \`${command}\` attached to terminal... `);
    let dyno = yield startDyno(context.app, command);
    console.log(`up, ${dyno.name}`);
    let uri = url.parse(dyno.attach_url);
    let client = net.connect(uri.port, uri.hostname, function () {
      client.write(uri.path.substr(1) + '\r\n');
    });
    client.on('data', function (data) {
      console.log('data');
      console.log(data.toString());
    });
    client.on('timeout', function () {
      console.error('timed out');
    });
    client.on('end', function (e) {
      console.log('disconnected', e);
    });
    client.on('close', function (e) {
      console.log('closed', e);
    });
  }).catch(errors.handleErr);
};
