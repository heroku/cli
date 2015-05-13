'use strict';
let git = require('../lib/git');
let h = require('heroku-cli-util');

module.exports = {
  topic: 'git',
  command: 'clone',
  needsAuth: true,
  args: [
    {name: 'DIRECTORY', optional: true}
  ],
  flags: [
    {name: 'app', char: 'a', hasValue: true},
    {name: 'remote', char: 'r', hasValue: true, description: 'the git remote to create, default "heroku"'},
    {name: 'ssh-git', description: 'use SSH git protocol'},
  ],
  run: h.command(function* (context, heroku) {
    let appName = context.flags.app;
    if (!appName) {
      return h.error('Specify an app with --app');
    }
    let app = yield heroku.apps(appName).info();
    let directory = context.args.DIRECTORY || app.name;
    let remote = context.flags.remote || 'heroku';
    let url = context.flags['ssh-git'] ? git.sshGitUrl(app.name) : git.httpGitUrl(app.name);
    yield git.spawn(['clone', '-o', remote, url, directory]);
  })
};
