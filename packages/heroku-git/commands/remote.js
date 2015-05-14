'use strict';
let git = require('../lib/git');
let cli = require('heroku-cli-util');

function includes (array, item) {
  return array.indexOf(item) !== -1;
}

module.exports = {
  topic: 'git',
  command: 'remote',
  needsAuth: true,
  variableArgs: true,
  flags: [
    {name: 'app', char: 'a', hasValue: true},
    {name: 'remote', char: 'r', hasValue: true},
    {name: 'ssh-git'},
  ],
  run: cli.command(function* (context, heroku) {
    let appName = context.flags.app || context.args.shift();
    if (!appName) {
      return cli.error('Specify an app with --app');
    }
    let app = yield heroku.apps(appName).info();
    let remote = context.flags.remote || (yield git.remoteFromGitConfig()) || 'heroku';
    let remotes = yield git.exec(['remote']);
    let url = context.flags['ssh-git'] ? git.sshGitUrl(app.name) : git.httpGitUrl(app.name);
    if (includes(remotes.split('\n'), remote)) {
      yield git.exec(['remote', 'set-url', remote, url].concat(context.args));
    } else {
      yield git.exec(['remote', 'add', remote, url].concat(context.args));
    }
    cli.log(`set git remote ${cli.color.cyan(remote)} to ${cli.color.cyan(url)}`);
  })
};
