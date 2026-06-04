import type {AppInfo, PipelineCouplingDetail} from '@heroku/sdk/resources/platform/app/info'

import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {
  AddOn, App, Collaborator, Dyno,
} from '@heroku/types/3.sdk'
import {Args, ux} from '@oclif/core'
import {filesize} from 'filesize'
import {inspect} from 'node:util'

import {getGeneration} from '../../lib/apps/generation.js'
import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'

type Platform = HerokuSDK<readonly [typeof appExtensions]>['platform']

type LocalApp = App & {
  create_status?: string
  cron_finished_at?: null | string
  cron_next_run?: null | string
  database_size?: null | number
  extended?: unknown
}

type Info = {
  addons: AddOn[]
  app: LocalApp
  collaborators: Collaborator[]
  dynos: Dyno[]
  pipeline_coupling: null | PipelineCouplingDetail
}

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

    const info = await getInfo(app, platform, flags.extended)
    const addons = info.addons.map(a => a.plan?.name).sort()
    const collaborators = info.collaborators.map(c => c.user.email)
      .filter(c => c !== info.app.owner.email)
      .sort()

    function shell() {
      function print(k: string, v: unknown) {
        ux.stdout(`${_.snakeCase(k)}=${v}`)
      }

      print('auto_cert_mgmt', info.app.acm)
      print('addons', addons)
      print('collaborators', collaborators)

      if (info.app.archived_at) print('archived_at', formatDate(new Date(info.app.archived_at)))
      if (info.app.cron_finished_at) print('cron_finished_at', formatDate(new Date(info.app.cron_finished_at)))
      if (info.app.cron_next_run) print('cron_next_run', formatDate(new Date(info.app.cron_next_run)))
      if (info.app.database_size) print('database_size', filesize(info.app.database_size, {round: 0, standard: 'jedec'}))
      if (info.app.create_status !== 'complete') print('create_status', info.app.create_status)
      if (info.pipeline_coupling) print('pipeline', `${info.pipeline_coupling.pipeline.name}:${info.pipeline_coupling.stage}`)

      print('git_url', info.app.git_url)
      print('web_url', info.app.web_url as string)
      print('repo_size', filesize(info.app.repo_size as number, {round: 0, standard: 'jedec'}))
      if (getGeneration(info.app) !== 'fir') print('slug_size', filesize(info.app.slug_size as number, {round: 0, standard: 'jedec'}))
      print('owner', info.app.owner.email)
      print('region', info.app.region.name)
      print('dynos', inspect(_.countBy(info.dynos, 'type')))
      print('stack', info.app.stack.name)
    }

    if (flags.shell) {
      shell()
    } else if (flags.json) {
      hux.styledJSON(info)
    } else {
      print(info, addons, collaborators, flags.extended, _)
    }
  }
}

function formatDate(date: Date) {
  return date.toISOString()
}

async function getInfo(app: string, platform: Platform, extended: boolean): Promise<Info> {
  const described: AppInfo = await platform.app.describe(app)

  const data: Info = {
    addons: described.addons,
    app: described.app,
    collaborators: described.collaborators,
    dynos: described.dynos,
    pipeline_coupling: described.pipelineCoupling,
  }

  if (extended) {
    const client = new HerokuApiClient()
    const response = await client.get(`/apps/${app}?extended=true`)
    const appExtended = await response.json() as LocalApp
    appExtended.acm = data.app.acm
    data.app = appExtended
  }

  return data
}

function print(info: Info, addons: (string | undefined)[], collaborators: (string | undefined)[], extended: boolean, _: any) {
  const data: Record<string, unknown> = {}
  data.Addons = addons
  data.Collaborators = collaborators

  if (info.app.archived_at) data['Archived At'] = formatDate(new Date(info.app.archived_at))
  if (info.app.cron_finished_at) data['Cron Finished At'] = formatDate(new Date(info.app.cron_finished_at))
  if (info.app.cron_next_run) data['Cron Next Run'] = formatDate(new Date(info.app.cron_next_run))
  if (info.app.database_size) data['Database Size'] = filesize(info.app.database_size, {round: 0, standard: 'jedec'})
  if (info.app.create_status !== 'complete') data['Create Status'] = info.app.create_status
  if (info.app.space) data.Space = color.space(info.app.space.name as string)
  if (info.app.space && info.app.internal_routing) data['Internal Routing'] = info.app.internal_routing
  if (info.pipeline_coupling) data.Pipeline = `${color.pipeline(info.pipeline_coupling.pipeline.name)} - ${info.pipeline_coupling.stage}`

  data['Auto Cert Mgmt'] = info.app.acm
  data['Git URL'] = info.app.git_url
  data['Web URL'] = color.info(info.app.web_url as string)
  data['Repo Size'] = filesize(info.app.repo_size as number, {round: 0, standard: 'jedec'})
  if (getGeneration(info.app) !== 'fir') data['Slug Size'] = filesize(info.app.slug_size as number, {round: 0, standard: 'jedec'})
  data.Owner = color.user(info.app.owner.email)
  data.Region = info.app.region.name
  data.Dynos = _.countBy(info.dynos, 'type')
  data.Stack = (function (app) {
    let stack = info.app.stack.name
    if (app.stack.name !== app.build_stack.name) {
      stack += ` (next build will use ${app.build_stack.name})`
    }

    return stack
  })(info.app)

  hux.styledHeader(color.app(info.app.name))
  hux.styledObject(data)

  if (extended) {
    ux.stdout('\n\n--- Extended Information ---\n\n')
    if (info.app.extended) {
      ux.stdout(inspect(info.app.extended))
    }
  }
}
