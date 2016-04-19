'use strict';

const cli = require('heroku-cli-util');
const co = require('co');
const child = require('child_process');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'login',
    description: 'Logs in to the Heroku Docker registry',
    needsApp: false,
    needsAuth: true,
    run: cli.command(co.wrap(login))
  };
};

function* login(context, heroku) {
  let herokuHost = process.env.HEROKU_HOST || 'heroku.com';
  let registry = `registry.${ herokuHost }`;
  let password = context.auth.password;

  try {
    let user = yield dockerLogin(registry, password);
  }
  catch (err) {
    cli.error(`Error: docker login exited with ${ err }`);
  }
}

function dockerLogin(registry, password) {
  return new Promise((resolve, reject) => {
    let args = [
      'login',
      '--email=_',
      '--username=_',
      `--password=${ password }`,
      registry
    ];
    child.spawn('docker', args, { stdio: 'inherit' })
      .on('exit', (code, signal) => {
        if (signal || code) reject(signal || code);
        else resolve();
      });
  });
}
