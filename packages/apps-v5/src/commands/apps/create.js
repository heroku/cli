'use strict'

let cli = require('heroku-cli-util')
const { safeLoad } = require('js-yaml')
const { readFile } = require('fs-extra')
const { flags } = require('@heroku-cli/command')
const { BuildpackCompletion, RegionCompletion, RemoteCompletion, SpaceCompletion, StackCompletion } = require('@heroku-cli/command/lib/completions')

function createText (name, space) {
  let text = `Creating ${name ? cli.color.app(name) : 'app'}`
  if (space) {
    text += ` in space ${space}`
  }
  return text
}

async function createApp (context, heroku, name, stack) {
  let params = {
    name,
    team: context.flags.team,
    region: context.flags.region,
    space: context.flags.space,
    stack,
    internal_routing: context.flags['internal-routing'],
    feature_flags: context.flags.features,
    kernel: context.flags.kernel,
    locked: context.flags.locked
  }

  let app = await heroku.request({
    method: 'POST',
    path: (params.space || params.team) ? '/teams/apps' : '/apps',
    body: params
  })

  let status = name ? 'done' : `done, ${cli.color.app(app.name)}`
  if (context.flags.region) status += `, region is ${cli.color.yellow(app.region.name)}`
  if (stack) status += `, stack is ${cli.color.yellow(app.stack.name)}`
  cli.action.done(status)
  return app
}

async function addAddons (heroku, app, addons) {
  for (let addon of addons) {
    let body = {
      plan: addon.plan
    }
    if (addon.as) {
      body.attachment = {
        name: addon.as
      }
    }

    let request = heroku.post(`/apps/${app.name}/addons`, { body })
    await cli.action(`Adding ${cli.color.green(addon.plan)}`, request)
  }
}

async function addConfigVars (heroku, app, configVars) {
  if (Object.keys(configVars).length > 0) {
    await cli.action('Setting config vars', heroku.patch(`/apps/${app.name}/config-vars`, {
      body: configVars
    }))
  }
}

function addonsFromPlans (plans) {
  return plans.map(plan => ({
    plan: plan.trim()
  }))
}

async function configureGitRemote (context, app, git) {
  let remoteUrl = context.flags['ssh-git'] ? git.sshGitUrl(app.name) : git.gitUrl(app.name)
  if (git.inGitRepo() && !context.flags['no-remote']) await git.createRemote(context.flags.remote || 'heroku', remoteUrl)
  return remoteUrl
}

function printAppSummary (context, app, remoteUrl) {
  if (context.flags.json) {
    cli.styledJSON(app)
  } else {
    cli.log(`${cli.color.cyan(app.web_url)} | ${cli.color.green(remoteUrl)}`)
  }
}

async function runFromFlags (context, heroku) {
  if (context.flags['internal-routing'] && !context.flags.space) throw new Error('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')

  let git = require('../../git')(context)
  let name = context.flags.app || context.args.app || process.env.HEROKU_APP

  function addBuildpack (app, buildpack) {
    return cli.action(`Setting buildpack to ${cli.color.cyan(buildpack)}`, heroku.request({
      method: 'PUT',
      path: `/apps/${app.name}/buildpack-installations`,
      headers: { Range: '' },
      body: { updates: [{ buildpack: buildpack }] }
    }))
  }

  let app = await cli.action(
    createText(name, context.flags.space), { success: false }, createApp(context, heroku, name, context.flags.stack))

  if (context.flags.addons) {
    let plans = context.flags.addons.split(',')
    let addons = addonsFromPlans(plans)
    await addAddons(heroku, app, addons)
  }
  if (context.flags.buildpack) await addBuildpack(app, context.flags.buildpack)
  let remoteUrl = await configureGitRemote(context, app, git)

  await context.config.runHook('recache', { type: 'app', app: app.name })
  printAppSummary(context, app, remoteUrl)
}

async function readManifest () {
  let buffer = await readFile('heroku.yml')
  return safeLoad(buffer, { filename: 'heroku.yml' })
}

async function runFromManifest (context, heroku) {
  let git = require('../../git')(context)
  let name = context.flags.app || context.args.app || process.env.HEROKU_APP

  let manifest = await cli.action('Reading heroku.yml manifest', readManifest())

  let app = await cli.action(
    createText(name, context.flags.space), { success: false }, createApp(context, heroku, name, 'container'))

  let setup = manifest.setup || {}
  let addons = setup.addons || []
  let configVars = setup.config || {}

  await addAddons(heroku, app, addons)
  await addConfigVars(heroku, app, configVars)
  let remoteUrl = await configureGitRemote(context, app, git)

  printAppSummary(context, app, remoteUrl)
}

function run (context, heroku) {
  if (context.config.channel === 'beta') {
    if (context.flags.manifest) {
      return runFromManifest(context, heroku)
    }
  }
  return runFromFlags(context, heroku)
}

let cmd = {
  description: 'creates a new app',
  examples: `$ heroku apps:create
Creating app... done, stack is heroku-20
https://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git

# or just
$ heroku create

# use a heroku.yml manifest file
$ heroku apps:create --manifest

# specify a buildpack
$ heroku apps:create --buildpack https://github.com/some/buildpack.git

# specify a name
$ heroku apps:create example

# create a staging app
$ heroku apps:create example-staging --remote staging

# create an app in the eu region
$ heroku apps:create --region eu`,
  needsAuth: true,
  wantsOrg: true,
  args: [{ name: 'app', optional: true, description: 'name of app to create' }],
  flags: [
    { name: 'app', char: 'a', hasValue: true, hidden: true },
    { name: 'addons', hasValue: true, description: 'comma-delimited list of addons to install' },
    { name: 'buildpack', char: 'b', hasValue: true, description: 'buildpack url to use for this app', completion: BuildpackCompletion },
    { name: 'manifest', char: 'm', hasValue: false, description: 'use heroku.yml settings for this app', hidden: true },
    { name: 'no-remote', char: 'n', description: 'do not create a git remote' },
    { name: 'remote', char: 'r', hasValue: true, description: 'the git remote to create, default "heroku"', completion: RemoteCompletion },
    { name: 'stack', char: 's', hasValue: true, description: 'the stack to create the app on', completion: StackCompletion },
    { name: 'space', hasValue: true, description: 'the private space to create the app in', completion: SpaceCompletion },
    { name: 'region', hasValue: true, description: 'specify region for the app to run in', completion: RegionCompletion },
    { name: 'ssh-git', description: 'use SSH git protocol for local git remote' },
    { name: 'internal-routing', hidden: true, description: 'private space-only. create as an Internal Web App that is only routable in the local network.' },
    { name: 'features', hidden: true, hasValue: true },
    { name: 'kernel', hidden: true, hasValue: true },
    { name: 'locked', hidden: true },
    { name: 'json', description: 'output in json format' },
    flags.team({ name: 'team', hasValue: true })
  ],
  run: cli.command(run)
}

module.exports = [
  Object.assign({ topic: 'apps', command: 'create' }, cmd),
  Object.assign({ hidden: true, topic: 'create' }, cmd)
]
