'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
const {flags} = require('@heroku-cli/command')
const {BuildpackCompletion, RegionCompletion, RemoteCompletion, SpaceCompletion, StackCompletion} = require('@heroku-cli/command/lib/completions')

function * run (context, heroku) {
  let git = require('../../git')(context)
  let name = context.flags.app || context.args.app || process.env.HEROKU_APP

  function createApp () {
    let params = {
      name,
      organization: context.org || context.team || context.flags.team,
      region: context.flags.region,
      space: context.flags.space,
      stack: context.flags.stack,
      kernel: context.flags.kernel,
      locked: context.flags.locked
    }

    return heroku.request({
      method: 'POST',
      path: (params.space || params.organization) ? '/organizations/apps' : '/apps',
      body: params
    }).then(app => {
      let status = name ? 'done' : `done, ${cli.color.app(app.name)}`
      if (context.flags.region) status += `, region is ${cli.color.yellow(app.region.name)}`
      if (context.flags.stack) status += `, stack is ${cli.color.yellow(app.stack.name)}`
      cli.action.done(status)
      return app
    })
  }

  let addAddons = co.wrap(function * (app, addons) {
    for (let addon of addons) {
      addon = addon.trim()
      let request = heroku.post(`/apps/${app.name}/addons`, {body: {plan: addon}})
      yield cli.action(`Adding ${cli.color.green(addon)}`, request)
    }
  })

  function addBuildpack (app, buildpack) {
    return cli.action(`Setting buildpack to ${cli.color.cyan(buildpack)}`, heroku.request({
      method: 'PUT',
      path: `/apps/${app.name}/buildpack-installations`,
      headers: {Range: ''},
      body: {updates: [{buildpack: buildpack}]}
    }))
  }

  function createText (name, space) {
    let text = `Creating ${name ? cli.color.app(name) : 'app'}`
    if (space) {
      text += ` in space ${space}`
    }
    return text
  }

  let app = yield cli.action(createText(name, context.flags.space), {success: false}, createApp())

  if (context.flags.addons) yield addAddons(app, context.flags.addons.split(','))
  if (context.flags.buildpack) yield addBuildpack(app, context.flags.buildpack)

  let remoteUrl = context.flags['ssh-git'] ? git.sshGitUrl(app.name) : git.gitUrl(app.name)
  if (git.inGitRepo() && !context.flags['no-remote']) yield git.createRemote(context.flags.remote || 'heroku', remoteUrl)
  if (context.flags.json) {
    cli.styledJSON(app)
  } else {
    cli.log(`${cli.color.cyan(app.web_url)} | ${cli.color.green(remoteUrl)}`)
  }
}

let cmd = {
  description: 'creates a new app',
  help: `Examples:

    $ heroku apps:create
    Creating app... done, stack is cedar-14
    https://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git

    # or just
    $ heroku create

    # specify a buildpack
    $ heroku apps:create --buildpack https://github.com/some/buildpack.git

    # specify a name
    $ heroku apps:create example

    # create a staging app
    $ heroku apps:create example-staging --remote staging

    # create an app in the eu region
    $ heroku apps:create --region eu
 `,
  needsAuth: true,
  wantsOrg: true,
  args: [{name: 'app', optional: true, description: 'name of app to create'}],
  flags: [
    {name: 'app', char: 'a', hasValue: true, hidden: true},
    {name: 'addons', hasValue: true, description: 'comma-delimited list of addons to install'},
    {name: 'buildpack', char: 'b', hasValue: true, description: 'buildpack url to use for this app', completion: BuildpackCompletion},
    {name: 'no-remote', char: 'n', description: 'do not create a git remote'},
    {name: 'remote', char: 'r', hasValue: true, description: 'the git remote to create, default "heroku"', completion: RemoteCompletion},
    {name: 'stack', char: 's', hasValue: true, description: 'the stack to create the app on', completion: StackCompletion},
    {name: 'space', hasValue: true, description: 'the private space to create the app in', completion: SpaceCompletion},
    {name: 'region', hasValue: true, description: 'specify region for the app to run in', completion: RegionCompletion},
    {name: 'ssh-git', description: 'use SSH git protocol for local git remote'},
    {name: 'kernel', hidden: true, hasValue: true},
    {name: 'locked', hidden: true},
    {name: 'json', description: 'output in json format'},
    // flags.org({name: 'org', hasValue: true}),
    flags.team({name: 'team', hasValue: true})
  ],
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'apps', command: 'create'}, cmd),
  Object.assign({hidden: true, topic: 'create'}, cmd)
]
