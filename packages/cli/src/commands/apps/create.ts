import {color, hux} from '@heroku/heroku-cli-util'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {
  BuildpackCompletion,
  RegionCompletion,
  SpaceCompletion,
  StackCompletion,
} from '@heroku-cli/command/lib/completions.js'
import * as Heroku from '@heroku-cli/schema'
import {Args, Interfaces, ux} from '@oclif/core'
import fs from 'fs-extra'
import {parse} from 'yaml'

import Git from '../../lib/git/git.js'

const git = new Git()

function createText(name: string, space: string) {
  let text = `Creating ${name ? color.app(name) : 'app'}`
  if (space) {
    text += ` in space ${space}`
  }

  return text
}

async function createApp(context: Interfaces.ParserOutput, heroku: APIClient, name: string, stack: string) {
  const {flags} = context
  const params = {
    feature_flags: flags.features,
    internal_routing: flags['internal-routing'],
    kernel: flags.kernel,
    locked: flags.locked,
    name,
    region: flags.region,
    space: flags.space,
    stack,
    team: flags.team,
  }

  const requestPath = (params.space || params.team) ? '/teams/apps' : '/apps'
  const {body: app} = await heroku.post<Heroku.App>(requestPath, {
    body: params,
  })

  let status = name ? 'done' : `done, ${color.app(app.name || '')}`
  if (flags.region) {
    status += `, region is ${color.yellow(app.region?.name || '')}`
  }

  if (stack) {
    status += `, stack is ${color.yellow(app.stack?.name || '')}`
  }

  ux.action.stop(status)

  return app
}

async function addAddons(heroku: APIClient, app: Heroku.App, addons: { as?: string, plan: string }[]) {
  for (const addon of addons) {
    const body = {
      attachment: addon.as ? {name: addon.as} : undefined,
      plan: addon.plan,
    }

    ux.action.start(`Adding ${color.addon(addon.plan)}`)
    await heroku.post(`/apps/${app.name}/addons`, {body})
    ux.action.stop()
  }
}

async function addConfigVars(heroku: APIClient, app: Heroku.App, configVars: Heroku.ConfigVars) {
  if (Object.keys(configVars).length > 0) {
    ux.action.start('Setting config vars')
    await heroku.patch(`/apps/${app.name}/config-vars`, {
      body: configVars,
    })
    ux.action.stop()
  }
}

function addonsFromPlans(plans: string[]) {
  return plans.map(plan => ({
    plan: plan.trim(),
  }))
}

async function configureGitRemote(context: Interfaces.ParserOutput, app: Heroku.App) {
  const remoteUrl = git.httpGitUrl(app.name || '')
  if (!context.flags['no-remote'] && git.inGitRepo()) {
    await git.createRemote(context.flags.remote || 'heroku', remoteUrl)
  }

  return remoteUrl
}

function printAppSummary(context: Interfaces.ParserOutput, app: Heroku.App, remoteUrl: string) {
  if (context.flags.json) {
    hux.styledJSON(app)
  } else {
    ux.stdout(`${color.cyan(app.web_url || '')} | ${color.green(remoteUrl)}`)
  }
}

async function runFromFlags(context: Interfaces.ParserOutput, heroku: APIClient, config: Interfaces.Config) {
  const {args, flags} = context
  if (flags['internal-routing'] && !flags.space) {
    throw new Error('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')
  }

  const name = flags.app || args.app || process.env.HEROKU_APP

  async function addBuildpack(app: Heroku.App, buildpack: string) {
    ux.action.start(`Setting buildpack to ${color.cyan(buildpack)}`)
    await heroku.put(`/apps/${app.name}/buildpack-installations`, {
      body: {updates: [{buildpack}]},
      headers: {Range: ''},
    })
    ux.action.stop()
  }

  ux.action.start(createText(name, flags.space))
  const app = await createApp(context, heroku, name, flags.stack)
  ux.action.stop()

  if (flags.addons) {
    const plans = flags.addons.split(',')
    const addons = addonsFromPlans(plans)
    await addAddons(heroku, app, addons)
  }

  if (flags.buildpack) {
    await addBuildpack(app, flags.buildpack)
  }

  const remoteUrl = await configureGitRemote(context, app)

  await config.runHook('recache', {app: app.name, type: 'app'})
  printAppSummary(context, app, remoteUrl)
}

export default class Create extends Command {
  static args = {
    app: Args.string({description: 'name of app to create', required: false}),
  }

  static description = 'creates a new app'

  static examples = [
    color.command(`heroku apps:create
Creating app... done, stack is heroku-24
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
$ heroku apps:create --region eu`),
  ]

  static flags = {
    addons: flags.string({description: 'comma-delimited list of addons to install'}),
    // `app` set to `flags.string` instead of `flags.app` to maintain original v5 functionality and avoid a default value from the git remote set when used without an app
    app: flags.string({hidden: true}),
    buildpack: flags.string({
      char: 'b',
      completion: BuildpackCompletion,
      description: 'buildpack url to use for this app',
    }),
    features: flags.string({hidden: true}),
    'internal-routing': flags.boolean({
      description: 'private space-only. create as an Internal Web App that is only routable in the local network.',
      hidden: true,
    }),
    json: flags.boolean({description: 'output in json format'}),
    kernel: flags.string({hidden: true}),
    locked: flags.boolean({hidden: true}),
    manifest: flags.boolean({char: 'm', description: 'use heroku.yml settings for this app', hidden: true}),
    'no-remote': flags.boolean({char: 'n', description: 'do not create a git remote'}),
    region: flags.string({completion: RegionCompletion, description: 'specify region for the app to run in'}),
    remote: flags.remote({default: 'heroku', description: 'the git remote to create, default "heroku"'}),
    space: flags.string({completion: SpaceCompletion, description: 'the private space to create the app in'}),
    stack: flags.string({char: 's', completion: StackCompletion, description: 'the stack to create the app on'}),
    team: flags.team(),
  }

  static hiddenAliases = ['create']

  async readManifest() {
    const buffer = await fs.readFile('heroku.yml')
    return parse(buffer.toString())
  }

  async run() {
    const context = await this.parse(Create)
    const {flags} = context

    if (flags.manifest) {
      return this.runFromManifest(context, this.heroku)
    }

    await runFromFlags(context, this.heroku, this.config)
  }

  async runFromManifest(context: Interfaces.ParserOutput, heroku: APIClient) {
    const {args, flags} = context
    const name = flags.app || args.app || process.env.HEROKU_APP

    ux.action.start('Reading heroku.yml manifest')
    const manifest = await this.readManifest()
    ux.action.stop()

    ux.action.start(createText(name, flags.space))
    const app = await createApp(context, heroku, name, 'container')
    ux.action.stop()

    const setup = (manifest as any)?.setup ?? {}
    const addons = setup.addons || []
    const configVars = setup.config || {}

    await addAddons(heroku, app, addons)
    await addConfigVars(heroku, app, configVars)
    const remoteUrl = await configureGitRemote(context, app)

    printAppSummary(context, app, remoteUrl)
  }
}
