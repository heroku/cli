'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let git = require('../../lib/git')

function * run (context, heroku) {
  git = git(context)
  let appName = context.flags.app
  if (!appName) throw new Error('Specify an app with --app')
  let app = yield heroku.get(`/apps/${appName}`)
  let directory = context.args.DIRECTORY || app.name
  let remote = context.flags.remote || 'heroku'
  yield git.spawn(['clone', '-o', remote, git.url(app.name, context.flags['ssh-git']), directory])
}

module.exports = {
  topic: 'git',
  command: 'clone',
  description: 'clones a heroku app to your local machine at DIRECTORY (defaults to app name)',
  help: `Examples:

  $ heroku git:clone -a example
  Cloning into 'example'...
  remote: Counting objects: 42, done.
  ...`,
  needsAuth: true,
  args: [
    {name: 'DIRECTORY', optional: true, description: 'where to clone the app'}
  ],
  flags: [
    {name: 'app', char: 'a', hasValue: true, description: 'the Heroku app to use'},
    {name: 'remote', char: 'r', hasValue: true, description: 'the git remote to create, default "heroku"'},
    {name: 'ssh-git', description: 'use SSH git protocol'}
  ],
  run: cli.command(co.wrap(run))
}
