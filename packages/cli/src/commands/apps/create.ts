import {ParserOutput} from '@oclif/core/lib/interfaces/parser'
import yaml = require('js-yaml')
import {readFile} from 'fs-extra'
import {APIClient, flags, Command} from '@heroku-cli/command'
import {
  BuildpackCompletion,
  RegionCompletion,
  SpaceCompletion,
  StackCompletion,
} from '@heroku-cli/command/lib/completions'
import {Args, Interfaces, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {get} from 'lodash'
import Git from '../../lib/git/git'

const git = new Git()

function createText(name: string, space: string) {
  let text = `Creating ${name ? color.app(name) : 'app'}`
  if (space) {
    text += ` in space ${space}`
  }

  return text
}

async function createApp(context: ParserOutput<Create>, heroku: APIClient, name: string, stack: string) {
  const {flags} = context
  const params = {
    name,
    team: flags.team,
    region: flags.region,
    space: flags.space,
    stack,
    internal_routing: flags['internal-routing'],
    feature_flags: flags.features,
    kernel: flags.kernel,
    locked: flags.locked,
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

async function addAddons(heroku: APIClient, app: Heroku.App, addons: { plan: string, as?: string }[]) {
  for (const addon of addons) {
    const body = {
      plan: addon.plan,
      attachment: addon.as ? {name: addon.as} : undefined,
    }

    ux.action.start(`Adding ${color.green(addon.plan)}`)
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

async function configureGitRemote(context: ParserOutput<Create>, app: Heroku.App) {
  const remoteUrl = git.httpGitUrl(app.name || '')
  if (!context.flags['no-remote'] && git.inGitRepo()) {
    await git.createRemote(context.flags.remote || 'heroku', remoteUrl)
  }

  return remoteUrl
}

function printAppSummary(context: ParserOutput<Create>, app: Heroku.App, remoteUrl: string) {
  if (context.flags.json) {
    ux.styledJSON(app)
  } else {
    ux.log(`${color.cyan(app.web_url || '')} | ${color.green(remoteUrl)}`)
  }
}

async function runFromFlags(context: ParserOutput<Create>, heroku: APIClient, config: Interfaces.Config) {
  const {flags, args} = context
  if (flags['internal-routing'] && !flags.space) {
    throw new Error('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')
  }

  const name = flags.app || args.app || process.env.HEROKU_APP

  async function addBuildpack(app: Heroku.App, buildpack: string) {
    ux.action.start(`Setting buildpack to ${color.cyan(buildpack)}`)
    await heroku.put(`/apps/${app.name}/buildpack-installations`, {
      headers: {Range: ''},
      body: {updates: [{buildpack: buildpack}]},
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

  await config.runHook('recache', {type: 'app', app: app.name})
  printAppSummary(context, app, remoteUrl)
}

async function readManifest() {
  const buffer = await readFile('heroku.yml')
  return yaml.load(buffer.toString(), {filename: 'heroku.yml'})
}

async function runFromManifest(context: ParserOutput<Create>, heroku: APIClient) {
  const {flags, args} = context
  const name = flags.app || args.app || process.env.HEROKU_APP

  ux.action.start('Reading heroku.yml manifest')
  const manifest = await readManifest()
  ux.action.stop()

  ux.action.start(createText(name, flags.space))
  const app = await createApp(context, heroku, name, 'container')
  ux.action.stop()

  // _.get used here to avoid type guards when working with `unknown`
  const setup = get(manifest, 'setup', {})
  const addons = setup.addons || []
  const configVars = setup.config || {}

  await addAddons(heroku, app, addons)
  await addConfigVars(heroku, app, configVars)
  const remoteUrl = await configureGitRemote(context, app)

  printAppSummary(context, app, remoteUrl)
}

export default class Create extends Command {
  static description = 'creates a new app'

  static aliases = ['create']

  static examples = [
    `$ heroku apps:create
Creating app... done, stack is heroku-22
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
  ]

  static args = {
    app: Args.string({description: 'name of app to create', required: false}),
  }

  static flags = {
    // `app` set to `flags.string` instead of `flags.app` to maintain original v5 functionality and avoid a default value from the git remote set when used without an app
    app: flags.string({hidden: true}),
    addons: flags.string({description: 'comma-delimited list of addons to install'}),
    buildpack: flags.string({
      char: 'b',
      description: 'buildpack url to use for this app',
      completion: BuildpackCompletion,
    }),
    manifest: flags.boolean({char: 'm', description: 'use heroku.yml settings for this app', hidden: true}),
    'no-remote': flags.boolean({char: 'n', description: 'do not create a git remote'}),
    remote: flags.remote({description: 'the git remote to create, default "heroku"', default: 'heroku'}),
    stack: flags.string({char: 's', description: 'the stack to create the app on', completion: StackCompletion}),
    space: flags.string({description: 'the private space to create the app in', completion: SpaceCompletion}),
    region: flags.string({description: 'specify region for the app to run in', completion: RegionCompletion}),
    'internal-routing': flags.boolean({
      hidden: true,
      description: 'private space-only. create as an Internal Web App that is only routable in the local network.',
    }),
    features: flags.string({hidden: true}),
    kernel: flags.string({hidden: true}),
    locked: flags.boolean({hidden: true}),
    json: flags.boolean({description: 'output in json format'}),
    team: flags.team(),
  }

  async run() {
    const context = await this.parse(Create)
    const {flags} = context

    if (this.config.channel === 'beta' && flags.manifest) {
      return runFromManifest(context, this.heroku)
    }

    await runFromFlags(context, this.heroku, this.config)
  }
}
