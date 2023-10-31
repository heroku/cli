import {Args, ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as util from 'util'
import * as _ from 'lodash'
const filesize = require('filesize')
const {countBy, snakeCase} = _

function formatDate(date: Date) {
  return date.toISOString()
}

async function getInfo(app: string, client: Command, extended: boolean) {
  // const promises = [
  //   // client.heroku.get<Heroku.App>(`/apps/${app}/addons`),
  //   client.heroku.request<Heroku.App>(`/apps/${app}`, {
  //     headers: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
  //   }),
  //   client.heroku.get<Heroku.App>(`/apps/${app}/dynos`).catch(() => []),
  //   client.heroku.get<Heroku.App>(`/apps/${app}/collaborators`).catch(() => []),
  //   client.heroku.get<Heroku.App>(`/apps/${app}/pipeline-couplings`).catch(() => null),
  // ]

  // if (extended) {
  //   promises.push(client.heroku.get<Heroku.App>(`/apps/${app}?extended=true`))
  // }

  let appExtendedResponse: Heroku.App = []
  const [addonsResponse, appWithMoreInfoResponse, dynosResponse, collaboratorsResponse, pipelineCouplingsResponse] = await Promise.all([
    client.heroku.get<Heroku.App>(`/apps/${app}/addons`),
    client.heroku.request<Heroku.App>(`/apps/${app}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    }),
    client.heroku.get<Heroku.App>(`/apps/${app}/dynos`).catch(() => []),
    client.heroku.get<Heroku.App>(`/apps/${app}/collaborators`).catch(() => []),
    client.heroku.get<Heroku.App>(`/apps/${app}/pipeline-couplings`).catch(() => null),
  ])

  if (extended) {
    appExtendedResponse = client.heroku.get<Heroku.App>(`/apps/${app}?extended=true`)
  }

  const addons = addonsResponse.body
  const appWithMoreInfo = appWithMoreInfoResponse.body
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const dynos = dynosResponse.body
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const collaborators = collaboratorsResponse.body
  const pipelineCouplings = pipelineCouplingsResponse!.body
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const appExtended = appExtendedResponse!.body || []

  const data: Heroku.App = {
    addons,
    app: appWithMoreInfo,
    dynos,
    collaborators,
    pipeline_coupling: pipelineCouplings,
  }

  console.log('DATA:', data)

  if (appExtended) {
    data.appExtended = appExtended
  }

  if (extended) {
    data.appExtended.acm = data.app.acm
    data.app = data.appExtended
    delete data.appExtended
  }

  return data
}

function print(info: Heroku.App, addons: any, collaborators: any, extended: boolean) {
  const data: Heroku.App = {}
  data.Addons = addons
  data.Collaborators = collaborators

  if (info.app.archived_at) data['Archived At'] = formatDate(new Date(info.app.archived_at))
  if (info.app.cron_finished_at) data['Cron Finished At'] = formatDate(new Date(info.app.cron_finished_at))
  if (info.app.cron_next_run) data['Cron Next Run'] = formatDate(new Date(info.app.cron_next_run))
  if (info.app.database_size) data['Database Size'] = filesize(info.app.database_size, {round: 0})
  if (info.app.create_status !== 'complete') data['Create Status'] = info.app.create_status
  if (info.app.space) data.Space = info.app.space.name
  if (info.app.space && info.app.internal_routing) data['Internal Routing'] = info.app.internal_routing
  if (info.pipeline_coupling) data.Pipeline = `${info.pipeline_coupling.pipeline.name} - ${info.pipeline_coupling.stage}`

  data['Auto Cert Mgmt'] = info.app.acm
  data['Git URL'] = info.app.git_url
  data['Web URL'] = info.app.web_url
  data['Repo Size'] = filesize(info.app.repo_size, {round: 0})
  data['Slug Size'] = filesize(info.app.slug_size, {round: 0})
  data.Owner = info.app.owner.email
  data.Region = info.app.region.name
  data.Dynos = countBy(info.dynos, 'type')
  data.Stack = (function (app) {
    let stack = info.app.stack.name
    if (app.stack.name !== app.build_stack.name) {
      stack += ` (next build will use ${app.build_stack.name})`
    }

    return stack
  })(info.app)

  ux.styledHeader(info.app.name)
  ux.styledObject(data)

  if (extended) {
    ux.log('\n\n--- Extended Information ---\n\n')
    if (info.app.extended) {
      ux.log(util.inspect(info.app.extended))
    }
  }
}

export default class AppsInfo extends Command {
  static description = 'show detailed app information'
  static topic = 'apps'
  static aliases = ['info']

  static examples = [
    '$ heroku apps:info',
    '$ heroku apps:info --shell',
  ]

  static flags = {
    app: flags.app({required: false}),
    shell: flags.boolean({char: 's', description: 'output more shell friendly key/value pairs'}),
    extended: flags.boolean({char: 'x'}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  static args = {
    app: Args.string({required: false}),
  }

  async run() {
    const {flags, args} = await this.parse(AppsInfo)

    const app = args.app || flags.app
    if (!app) throw new Error('No app specified.\nUSAGE: heroku info my-app')

    flags.app = app // make sure context.app is always set for herkou-cli-util

    const info = await getInfo(app, this, flags.extended)
    // console.log('info', info)
    const addons = info.addons.map((a: any) => a.plan.name).sort()
    const collaborators = info.collaborators.map((c: any) => c.user.email).filter((c: any) => c !== info.app.owner.email).sort()

    function shell() {
      function print(k: string, v: string) {
        ux.log(`${snakeCase(k)}=${v}`)
      }

      print('auto_cert_mgmt', info.app.acm)
      print('addons', addons)
      print('collaborators', collaborators)

      if (info.app.archived_at) print('archived_at', formatDate(new Date(info.app.archived_at)))
      if (info.app.cron_finished_at) print('cron_finished_at', formatDate(new Date(info.app.cron_finished_at)))
      if (info.app.cron_next_run) print('cron_next_run', formatDate(new Date(info.app.cron_next_run)))
      if (info.app.database_size) print('database_size', filesize(info.app.database_size, {round: 0}))
      if (info.app.create_status !== 'complete') print('create_status', info.app.create_status)
      if (info.pipeline_coupling) print('pipeline', `${info.pipeline_coupling.pipeline.name}:${info.pipeline_coupling.stage}`)

      print('git_url', info.app.git_url)
      print('web_url', info.app.web_url)
      print('repo_size', filesize(info.app.repo_size, {round: 0}))
      print('slug_size', filesize(info.app.slug_size, {round: 0}))
      print('owner', info.app.owner.email)
      print('region', info.app.region.name)
      print('dynos', util.inspect(countBy(info.dynos, 'type')))
      print('stack', info.app.stack.name)
    }

    if (flags.shell) {
      shell()
    } else if (flags.json) {
      ux.styledJSON(info)
    } else {
      print(info, addons, collaborators, flags.extended)
    }
  }
}
