import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import {appExtensions, AppInfo} from '@heroku/sdk/extensions/platform'
import {AddOn, App, Collaborator} from '@heroku/types/3.sdk'
import {Args, ux} from '@oclif/core'
import {filesize} from 'filesize'
import {inspect} from 'node:util'

import {getGeneration} from '../../lib/apps/generation.js'
import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'

export default class AppsInfo extends Command {
  static args = {
    app: Args.string({hidden: true}),
  }
  static description = 'show detailed app information'
  static examples = [
    color.command('heroku apps:info'),
    color.command('heroku apps:info --shell'),
  ]
  static flags = {
    app: flags.app(),
    extended: flags.boolean({char: 'x', hidden: true}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    remote: flags.remote(),
    shell: flags.boolean({char: 's', description: 'output more shell friendly key/value pairs'}),
  }
  static help = `$ heroku apps:info
=== example
Git URL:   https://git.heroku.com/example.git
Repo Size: 5M
...

$ heroku apps:info --shell
git_url=https://git.heroku.com/example.git
repo_size=5000000
...`
  static hiddenAliases = ['info']
  static topic = 'apps'

  async run() {
    const _ = await lazyModuleLoader.loadLodash()

    const {args, flags} = await this.parse(AppsInfo)

    const app = args.app || flags.app
    if (!app) throw new Error('No app specified.\nUSAGE: heroku apps:info --app my-app')

    const {platform} = new HerokuSDK({extensions: [appExtensions]})
    const extendedPromise = flags.extended
      ? new HerokuApiClient()
        .get(`/apps/${encodeURIComponent(app)}`, {searchParams: {extended: 'true'}})
        .then(r => r.json() as Promise<{extended?: unknown}>)
      : undefined
    const [info, extendedApp] = await Promise.all([
      platform.app.describe(app),
      extendedPromise,
    ])
    const addons = info.addons.map((a: AddOn) => a.plan?.name).sort()
    const collaborators = info.collaborators.map((c: Collaborator) => c.user.email)
      .filter((c: string) => c !== info.app.owner.email)
      .sort()

    function shell() {
      function print(k: string, v: unknown) {
        ux.stdout(`${_.snakeCase(k)}=${v}`)
      }

      print('auto_cert_mgmt', info.app.acm)
      print('addons', addons)
      print('collaborators', collaborators)

      if (info.app.archived_at) print('archived_at', formatDate(new Date(info.app.archived_at)))
      if (info.pipelineCoupling) print('pipeline', `${info.pipelineCoupling.pipeline.name}:${info.pipelineCoupling.stage}`)

      print('git_url', info.app.git_url)
      print('web_url', info.app.web_url)
      print('repo_size', filesize(info.app.repo_size ?? 0, {round: 0, standard: 'jedec'}))
      if (getGeneration(info.app) !== 'fir') print('slug_size', filesize(info.app.slug_size!, {round: 0, standard: 'jedec'}))
      print('owner', info.app.owner.email)
      print('region', info.app.region.name)
      print('dynos', inspect(_.countBy(info.dynos, 'type')))
      print('stack', info.app.stack.name)
    }

    if (flags.shell) {
      shell()
    } else if (flags.json) {
      hux.styledJSON(toJsonShape(info))
    } else {
      print(info, addons, collaborators, _)
      if (extendedApp?.extended) {
        ux.stdout('\n\n--- Extended Information ---\n\n')
        ux.stdout(inspect(extendedApp.extended))
      }
    }
  }
}

function formatDate(date: Date) {
  return date.toISOString()
}

/**
 * Convert the SDK's camelCase AppInfo to the snake_case JSON shape the
 * CLI has historically emitted via --json. The SDK contract is camelCase;
 * key formatting is presentation, so it lives here.
 */
function toJsonShape(info: AppInfo): Record<string, unknown> {
  return {
    addons: info.addons,
    app: info.app,
    collaborators: info.collaborators,
    dynos: info.dynos,
    pipeline_coupling: info.pipelineCoupling,
  }
}

function print(info: AppInfo, addons: Array<string | undefined>, collaborators: string[], _: any) {
  const data: Record<string, unknown> = {}
  data.Addons = addons
  data.Collaborators = collaborators

  if (info.app.archived_at) data['Archived At'] = formatDate(new Date(info.app.archived_at))
  if (info.app.space?.name) data.Space = color.space(info.app.space.name)
  if (info.app.space && info.app.internal_routing) data['Internal Routing'] = info.app.internal_routing
  if (info.pipelineCoupling) data.Pipeline = `${color.pipeline(info.pipelineCoupling.pipeline.name)} - ${info.pipelineCoupling.stage}`

  data['Auto Cert Mgmt'] = info.app.acm
  data['Git URL'] = info.app.git_url
  data['Web URL'] = color.info(info.app.web_url ?? '')
  data['Repo Size'] = filesize(info.app.repo_size ?? 0, {round: 0, standard: 'jedec'})
  if (getGeneration(info.app) !== 'fir') data['Slug Size'] = filesize(info.app.slug_size!, {round: 0, standard: 'jedec'})
  data.Owner = color.user(info.app.owner.email)
  data.Region = info.app.region.name
  data.Dynos = _.countBy(info.dynos, 'type')
  data.Stack = (function (app: App) {
    let stack = info.app.stack.name
    if (app.stack.name !== app.build_stack.name) {
      stack += ` (next build will use ${app.build_stack.name})`
    }

    return stack
  })(info.app)

  hux.styledHeader(color.app(info.app.name))
  hux.styledObject(data)
}
