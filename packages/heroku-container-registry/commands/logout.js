'use strict';

const cli = require('heroku-cli-util');
const co = require('co');
const child = require('child_process');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'logout',
    flags: [{ name: 'verbose', char: 'v', hasValue: false }],
    description: 'Logs out from the Heroku Docker registry',
    needsApp: false,
    needsAuth: false,
    run: cli.command(co.wrap(logout))
  };
};

function* logout(context, heroku) {
  let herokuHost = process.env.HEROKU_HOST || 'heroku.com';
  let registry = `registry.${ herokuHost }`;

  try {
    let user = yield dockerLogout(registry, context.flags.verbose);
  }
  catch (err) {
    cli.error(`Error: docker logout exited with ${ err }`);
  }
}

function dockerLogout(registry, verbose) {
  return new Promise((resolve, reject) => {
    let args = [
      'logout',
      registry
    ];
    if (verbose) {
      console.log(['> docker'].concat(args).join(' '));
    }
    child.spawn('docker', args, { stdio: 'inherit' })
      .on('exit', (code, signal) => {
        if (signal || code) reject(signal || code);
        else resolve();
      });
  });
}
