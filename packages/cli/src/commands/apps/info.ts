import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import {filesize} from 'filesize'
import _ from 'lodash'
import * as util from 'util'

import {getGeneration} from '../../lib/apps/generation.js'

const {countBy, snakeCase} = _

function formatDate(date: Date) {
  return date.toISOString()
}

async function getInfo(app: string, client: Command, extended: boolean) {
  const promises = [
    client.heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`),
    client.heroku.request<Heroku.App>(`/apps/${app}`),
    client.heroku.get<Heroku.Dyno[]>(`/apps/${app}/dynos`).catch(() => ({body: []})),
    client.heroku.get<Heroku.Collaborator[]>(`/apps/${app}/collaborators`).catch(() => ({body: []})),
    client.heroku.get<Heroku.PipelineCoupling[]>(`/apps/${app}/pipeline-couplings`).catch(() => ({body: null})),
  ]

  if (extended) {
    promises.push(client.heroku.get<Heroku.App>(`/apps/${app}?extended=true`))
  }

  const [
    {body: addons},
    {body: appWithMoreInfo},
    {body: dynos},
    {body: collaborators},
    {body: pipelineCouplings},
    appExtendedResponse,
  ] = await Promise.all(promises)

  const data: Heroku.App = {
    addons,
    app: appWithMoreInfo,
    collaborators,
    dynos,
    pipeline_coupling: pipelineCouplings,
  }

  if (appExtendedResponse) {
    data.appExtended = appExtendedResponse.body
  }

  if (extended) {
    data.appExtended.acm = data.app.acm
    data.app = data.appExtended
    delete data.appExtended
  }

  return data
}

function print(info: Heroku.App, addons: Heroku.AddOn[], collaborators: Heroku.Collaborator[], extended: boolean) {
  const data: Heroku.App = {}
  data.Addons = addons
  data.Collaborators = collaborators

  if (info.app.archived_at) data['Archived At'] = formatDate(new Date(info.app.archived_at))
  if (info.app.cron_finished_at) data['Cron Finished At'] = formatDate(new Date(info.app.cron_finished_at))
  if (info.app.cron_next_run) data['Cron Next Run'] = formatDate(new Date(info.app.cron_next_run))
  if (info.app.database_size) data['Database Size'] = filesize(info.app.database_size, {round: 0, standard: 'jedec'})
  if (info.app.create_status !== 'complete') data['Create Status'] = info.app.create_status
  if (info.app.space) data.Space = color.space(info.app.space.name)
  if (info.app.space && info.app.internal_routing) data['Internal Routing'] = info.app.internal_routing
  if (info.pipeline_coupling) data.Pipeline = `${color.pipeline(info.pipeline_coupling.pipeline.name)} - ${info.pipeline_coupling.stage}`

  data['Auto Cert Mgmt'] = info.app.acm
  data['Git URL'] = info.app.git_url
  data['Web URL'] = color.info(info.app.web_url)
  data['Repo Size'] = filesize(info.app.repo_size, {round: 0, standard: 'jedec'})
  if (getGeneration(info.app) !== 'fir') data['Slug Size'] = filesize(info.app.slug_size, {round: 0, standard: 'jedec'})
  data.Owner = color.user(info.app.owner.email)
  data.Region = info.app.region.name
  data.Dynos = countBy(info.dynos, 'type')
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
      ux.stdout(util.inspect(info.app.extended))
    }
  }
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
    const {args, flags} = await this.parse(AppsInfo)

    const app = args.app || flags.app
    if (!app) throw new Error('No app specified.\nUSAGE: heroku apps:info --app my-app')

    const info = await getInfo(app, this, flags.extended)
    const addons = info.addons.map((a: Heroku.AddOn) => a.plan?.name).sort()
    const collaborators = info.collaborators.map((c: Heroku.Collaborator) => c.user.email)
      .filter((c: Heroku.Collaborator) => c !== info.app.owner.email)
      .sort()

    function shell() {
      function print(k: string, v: string) {
        ux.stdout(`${snakeCase(k)}=${v}`)
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
      print('web_url', info.app.web_url)
      print('repo_size', filesize(info.app.repo_size, {round: 0, standard: 'jedec'}))
      if (getGeneration(info.app) !== 'fir') print('slug_size', filesize(info.app.slug_size, {round: 0, standard: 'jedec'}))
      print('owner', info.app.owner.email)
      print('region', info.app.region.name)
      print('dynos', util.inspect(countBy(info.dynos, 'type')))
      print('stack', info.app.stack.name)
    }

    if (flags.shell) {
      shell()
    } else if (flags.json) {
      hux.styledJSON(info)
    } else {
      print(info, addons, collaborators, flags.extended)
    }
  }
}
