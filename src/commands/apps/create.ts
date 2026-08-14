import type {CreateAndSetupInput} from '@heroku/sdk/resources/platform/app'

import {Command, flags} from '@heroku-cli/command'
import {
  BuildpackCompletion,
  RegionCompletion,
  SpaceCompletion,
  StackCompletion,
} from '@heroku-cli/command/lib/completions.js'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {ConfigVarUpdateOpts} from '@heroku/types/3.sdk'
import {Args, Interfaces, ux} from '@oclif/core'
import fs from 'fs-extra'

import {sdkClientOptions} from '../../lib/apps/client-options.js'
import Git from '../../lib/git/git.js'
import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {App} from '../../lib/types/app.js'

const git = new Git()

type Platform = HerokuSDK<readonly [typeof appExtensions]>['platform']

function createText(name: string, space: string) {
  let text = `Creating ${name ? color.app(name) : 'app'}`
  if (space) {
    text += ` in space ${space}`
  }

  return text
}

function buildCreateInput(
  context: Interfaces.ParserOutput,
  name: string,
  stack: string,
  extras: {addons?: {as?: string, plan: string}[], buildpack?: string, configVars?: ConfigVarUpdateOpts},
): CreateAndSetupInput {
  const {flags} = context
  return {
    addons: extras.addons,
    buildpack: extras.buildpack,
    configVars: extras.configVars,
    // 4 fields the closed CreateAndSetupInput type omits; forwarded at runtime by the SDK's ...createParams spread.
    feature_flags: flags.features,
    internal_routing: flags['internal-routing'],
    kernel: flags.kernel,
    locked: flags.locked,
    name,
    region: flags.region,
    space: flags.space,
    stack,
    team: flags.team,
  } as CreateAndSetupInput
}

function buildCreateStatus(app: App, name: string, region: string | undefined, stack: string): string {
  let status = name ? 'done' : `done, ${color.app(app.name || '')}`
  if (region) {
    status += `, region is ${color.info(app.region?.name || '')}`
  }

  if (stack) {
    status += `, stack is ${color.info(app.stack?.name || '')}`
  }

  return status
}

function addonsFromPlans(plans: string[]) {
  return plans.map(plan => ({
    plan: plan.trim(),
  }))
}

async function configureGitRemote(context: Interfaces.ParserOutput, app: App) {
  const remoteUrl = git.httpGitUrl(app.name || '')
  if (!context.flags['no-remote'] && git.inGitRepo()) {
    await git.createRemote(context.flags.remote || 'heroku', remoteUrl)
    await git.configureCredentialHelper()
  }

  return remoteUrl
}

function printAppSummary(context: Interfaces.ParserOutput, app: App, remoteUrl: string) {
  if (context.flags.json) {
    hux.styledJSON(app)
  } else {
    ux.stdout(`${color.info(app.web_url || '')} | ${color.info(remoteUrl)}`)
  }
}

async function runFromFlags(context: Interfaces.ParserOutput, platform: Platform, config: Interfaces.Config) {
  const {args, flags} = context
  if (flags['internal-routing'] && !flags.space) {
    throw new Error('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')
  }

  const name = flags.app || args.app || process.env.HEROKU_APP

  ux.action.start(createText(name, flags.space))
  const addons = flags.addons ? addonsFromPlans(flags.addons.split(',')) : undefined
  const app = await platform.app.createAndSetup(buildCreateInput(context, name, flags.stack, {addons, buildpack: flags.buildpack}))
  ux.action.stop(buildCreateStatus(app, name, flags.region, flags.stack))

  const remoteUrl = await configureGitRemote(context, app)

  await config.runHook('recache', {app: app.name, type: 'app'})
  printAppSummary(context, app, remoteUrl)

  return app
}

export default class Create extends Command {
  static args = {
    app: Args.string({description: 'name of app to create', required: false}),
  }
  static description = 'creates a new app'
  static examples = [`
${color.command('heroku apps:create')}
Creating app... done, stack is heroku-24
https://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git`, `
# or just
${color.command('heroku create')}`, `
# use a heroku.yml manifest file
${color.command('heroku apps:create --manifest')}`, `
# specify a buildpack
${color.command('heroku apps:create --buildpack https://github.com/some/buildpack.git')}`, `
# specify a name
${color.command('heroku apps:create example')}`, `
# create a staging app
${color.command('heroku apps:create example-staging --remote staging')}`, `
# create an app in the eu region
${color.command('heroku apps:create --region eu')}`]
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
    const {parse} = await lazyModuleLoader.loadYaml()
    const buffer = await fs.readFile('heroku.yml')
    return parse(buffer.toString())
  }

  async run() {
    const context = await this.parse(Create)
    const {flags} = context
    const {platform} = new HerokuSDK({clientOptions: sdkClientOptions(this.heroku), extensions: [appExtensions]})

    if (flags.manifest) {
      return this.runFromManifest(context, platform)
    }

    return runFromFlags(context, platform, this.config)
  }

  async runFromManifest(context: Interfaces.ParserOutput, platform: Platform) {
    const {args, flags} = context
    const name = flags.app || args.app || process.env.HEROKU_APP

    ux.action.start('Reading heroku.yml manifest')
    const manifest = await this.readManifest()
    ux.action.stop()

    const setup = (manifest as any)?.setup ?? {}

    ux.action.start(createText(name, flags.space))
    const app = await platform.app.createAndSetup(buildCreateInput(context, name, 'container', {addons: setup.addons || [], configVars: setup.config || {}}))
    ux.action.stop(buildCreateStatus(app, name, flags.region, 'container'))

    const remoteUrl = await configureGitRemote(context, app)

    printAppSummary(context, app, remoteUrl)

    return app
  }
}
