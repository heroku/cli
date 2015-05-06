'use strict';
let exec = require('child_process').exec;
let h = require('heroku-cli-util');
let chalk = require('chalk');

function git (cmd) {
  return new Promise(function (fulfill, reject) {
    exec(`git ${cmd}`, function (error, stdout) {
      if (error) { return reject(error); }
      fulfill(stdout.trim());
    });
  });
}

function includes (array, item) {
  return array.indexOf(item) !== -1;
}

function remoteFromGitConfig () {
  return git('config heroku.remote').catch(function () {});
}

module.exports = {
  topic: 'git',
  command: 'remote',
  needsAuth: true,
  flags: [
    {name: 'app', char: 'a', hasValue: true},
    {name: 'remote', char: 'r', hasValue: true},
    {name: 'ssh-git'},
  ],
  run: h.command(function* (context, heroku) {
    let appName = context.flags.app;
    if (!appName) {
      return h.error('Specify an app with --app');
    }
    let app = yield heroku.apps(appName).info();
    let remote = context.flags.remote || (yield remoteFromGitConfig()) || 'heroku';
    let remotes = yield git('remote');
    let url = context.flags['ssh-git'] ?
      `git@${h.gitHost()}:${app.name}.git` :
      `https://${h.httpGitHost()}/${app.name}.git`;
    if (includes(remotes.split('\n'), remote)) {
      yield git(`remote set-url ${remote} ${url}`);
    } else {
      yield git(`remote add ${remote} ${url}`);
    }
    console.log(`set git remote ${chalk.blue(remote)} to ${chalk.blue(url)}`);
  })
};
