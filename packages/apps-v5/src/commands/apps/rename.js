'use strict'

const cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  const _ = require('lodash')

  let git = require('../../git')(context)

  let oldApp = context.app
  let newApp = context.args.newname

  let request = heroku.request({
    method: 'PATCH',
    path: `/apps/${oldApp}`,
    body: {name: newApp},
  })
  let app = await cli.action(`Renaming ${cli.color.cyan(oldApp)} to ${cli.color.green(newApp)}`, request)
  let gitUrl = git.gitUrl(app.name)
  cli.log(`${app.web_url} | ${gitUrl}`)

  if (!app.web_url.includes('https')) {
    cli.log('Please note that it may take a few minutes for Heroku to provision a SSL certificate for your application.')
  }

  if (git.inGitRepo()) {
    // delete git remotes pointing to this app
    await _(await git.listRemotes())
      .filter(r => git.gitUrl(oldApp) === r[1] || git.sshGitUrl(oldApp) === r[1])
      .map(r => r[0])
      .uniq()
      .map(r => {
        return git.rmRemote(r)
          .then(() => git.createRemote(r, gitUrl))
          .then(() => cli.log(`Git remote ${r} updated`))
      }).value()
  }

  cli.warn("Don't forget to update git remotes for all other local checkouts of the app.")
}

let cmd = {
  description: 'rename an app',
  help: 'This will locally update the git remote if it is set to the old app.',
  examples: `$ heroku apps:rename --app oldname newname
https://newname-xxxxxxxxxxxx.herokuapp.com/ | https://git.heroku.com/newname.git
Git remote heroku updated`,
  needsAuth: true,
  needsApp: true,
  args: [{name: 'newname'}],
  run: cli.command(run),
}

module.exports = [
  Object.assign({topic: 'apps', command: 'rename'}, cmd),
  Object.assign({topic: 'rename', hidden: true}, cmd),
]
