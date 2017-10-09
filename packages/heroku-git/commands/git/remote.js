'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let Git = require('../../lib/git')
let process = require('process')

function includes (array, item) {
  return array.indexOf(item) !== -1
}

function * run (context, heroku) {
  let git = Git(context)
  let appName = context.flags.app || context.args.shift() || process.env.HEROKU_APP
  if (!appName) {
    throw new Error('Specify an app with --app')
  }
  let app = yield heroku.get(`/apps/${appName}`)
  let remote = context.flags.remote || (yield git.remoteFromGitConfig()) || 'heroku'
  let remotes = yield git.exec(['remote'])
  let url = git.url(app.name, context.flags['ssh-git'])
  if (includes(remotes.split('\n'), remote)) {
    yield git.exec(['remote', 'set-url', remote, url].concat(context.args))
  } else {
    yield git.exec(['remote', 'add', remote, url].concat(context.args))
  }
  let newRemote = yield git.remoteUrl(remote)
  cli.log(`set git remote ${cli.color.cyan(remote)} to ${cli.color.cyan(newRemote)}`)
}

module.exports = {
  topic: 'git',
  command: 'remote',
  description: 'adds a git remote to an app repo',
  help: `extra arguments will be passed to git remote add

Examples:

    # set git remote heroku to https://git.heroku.com/example.git
    $ heroku git:remote -a example

    # set git remote heroku-staging to https://git.heroku.com/example-staging.git
    $ heroku git:remote --remote heroku-staging -a example`,
  needsAuth: true,
  variableArgs: true,
  flags: [
    {name: 'app', char: 'a', hasValue: true, description: 'the Heroku app to use'},
    {name: 'remote', char: 'r', hasValue: true, description: 'the git remote to create'},
    {name: 'ssh-git', description: 'use SSH git protocol'}
  ],
  run: cli.command(co.wrap(run))
}
