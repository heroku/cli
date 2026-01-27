import {color, hux} from '@heroku/heroku-cli-util'
import {APIClient, Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {execSync} from 'child_process'
import _ from 'lodash'
import * as path from 'path'
import * as process from 'process'
import img from 'term-img'

import {ago} from '../lib/time.js'
import {AppErrors} from '../lib/types/app_errors.js'
import {sparkline} from '../lib/utils/sparkline.js'

type AppsWithMoreInfo = {
  app: Heroku.App
  formation: Heroku.Formation
  pipeline?: Heroku.PipelineCoupling
}

type FetchMetricsResponse =  {
  dynoErrors: (AppErrors | undefined)[]
  routerErrors?: AppErrors
  routerLatency?: AppErrors
  routerStatus?: AppErrors
}[]

const empty = (o: Record<string, any>) => Object.keys(o).length === 0

function displayFormation(formation: Heroku.Formation) {
  formation = _.groupBy(formation, 'size')
  formation = _.map(formation, (p, size) => `${bold(_.sumBy(p, 'quantity').toString())} | ${size}`)
  ux.stdout(`  ${label('Dynos:')} ${formation.join(', ')}`)
}

function displayErrors(metrics: FetchMetricsResponse[0]) {
  let errors: string[] = []
  if (metrics.routerErrors) {
    errors = errors.concat(Object.entries(metrics.routerErrors.data)
      .map(e => color.failure(`${_.sum(e[1])} ${e[0]}`)))
  }

  if (metrics.dynoErrors) {
    metrics.dynoErrors.filter(Boolean)
      .forEach(dynoErrors => {
        errors = errors.concat(Object.entries(dynoErrors?.data || {})
          .map(e => color.failure(`${_.sum(e[1])} ${e[0]}`)))
      })
  }

  if (errors.length > 0)
    ux.stdout(`  ${label('Errors:')} ${errors.join(dim(', '))} (see details with ${color.cyan.bold('heroku apps:errors')})`)
}

function displayMetrics(metrics: FetchMetricsResponse[0]) {
  function rpmSparkline() {
    if (['win32', 'windows'].includes(process.platform))
      return ''
    const points: number[] = []
    Object.values(metrics.routerStatus?.data || {})
      .forEach(cur => {
        for (const [i, element] of cur.entries()) {
          const j = Math.floor(i / 3)
          points[j] = (points[j] || 0) + element
        }
      })
    points.pop()
    return dim(sparkline(points)) + ' last 24 hours rpm'
  }

  let ms = ''
  let rpm = ''
  if (metrics.routerLatency && !empty(metrics.routerLatency.data)) {
    const latency = metrics.routerLatency.data['latency.ms.p50']
    if (!empty(latency))
      ms = `${_.round(_.mean(latency))} ms `
  }

  if (metrics.routerStatus && !empty(metrics.routerStatus.data)) {
    rpm = `${_.round(_.sum(Object.values(metrics.routerStatus.data).flat()) / 24 / 60)} rpm ${rpmSparkline()}`
  }

  if (rpm || ms)
    ux.stdout(`  ${label('Metrics:')} ${ms}${rpm}`)
}

function displayNotifications(notifications?: {read: boolean}[]) {
  if (!notifications)
    return
  notifications = notifications.filter(n => !n.read)
  if (notifications.length > 0) {
    ux.stdout(`\nYou have ${color.yellow(notifications.length.toString())} unread notifications. Read them with ${color.cyan.bold('heroku notifications')}`)
  }
}

const dim = (s: string) => color.dim(s)
const bold = (s: string) => color.bold(s)
const label = (s: string) => color.label(s)

const fetchMetrics = async (apps: Heroku.App[], heroku: APIClient): Promise<FetchMetricsResponse> => {
  const NOW = new Date().toISOString()
  const YESTERDAY = new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString()
  const date = `start_time=${YESTERDAY}&end_time=${NOW}&step=1h`

  const metricsData = await Promise.all(apps.map(app => {
    const types = app.formation.map((p: Heroku.Formation) => p.type)
    const dynoErrorsPromise: Promise<(AppErrors | undefined)[]> = Promise.all(
      types.map((type: string) => heroku.get<AppErrors>(
        `/apps/${app.app.name}/formation/${type}/metrics/errors?${date}`,
        {hostname: 'api.metrics.herokai.com'},
      ).catch(() => {}),
      ),
    )
    return Promise.all([
      dynoErrorsPromise,
      heroku.get<AppErrors>(`/apps/${app.app.name}/router-metrics/latency?${date}&process_type=${types[0]}`, {hostname: 'api.metrics.herokai.com'}).catch(() => {}),
      heroku.get<AppErrors>(`/apps/${app.app.name}/router-metrics/errors?${date}&process_type=${types[0]}`, {hostname: 'api.metrics.herokai.com'}).catch(() => {}),
      heroku.get<AppErrors>(`/apps/${app.app.name}/router-metrics/status?${date}&process_type=${types[0]}`, {hostname: 'api.metrics.herokai.com'}).catch(() => {}),
    ])
  }))

  return metricsData.map(([dynoErrors, routerLatency, routerErrors, routerStatus]) => ({
    dynoErrors, routerErrors: routerErrors?.body, routerLatency: routerLatency?.body, routerStatus: routerStatus?.body,
  }))
}

function displayApps(apps: AppsWithMoreInfo[], appsMetrics: FetchMetricsResponse) {
  const getOwner = (owner: Heroku.App['owner']) => owner?.email?.endsWith('@herokumanager.com') ? owner.email.split('@')[0] : owner?.email
  const zipped = _.zip(apps, appsMetrics) as [AppsWithMoreInfo, FetchMetricsResponse[0]][]
  for (const a of zipped) {
    const app = a[0]
    const metrics = a[1]
    hux.styledHeader(color.app(app.app.name || ''))
    ux.stdout(`  ${label('Owner:')} ${getOwner(app.app.owner)}`)
    if (app.pipeline) {
      ux.stdout(`  ${label('Pipeline:')} ${app.pipeline.pipeline?.name}`)
    }

    displayFormation(app.formation)
    ux.stdout(`  ${label('Last release:')} ${ago(new Date(app.app.released_at || ''))}`)
    displayMetrics(metrics)
    displayErrors(metrics)
    ux.stdout()
  }
}

export default class Dashboard extends Command {
  static description = 'display information about favorite apps'
  static hidden = true
  static topic = 'dashboard'
  public async run(): Promise<void> {
    if (!this.heroku.auth && process.env.IS_HEROKU_TEST_ENV !== 'true') {
      execSync('heroku help', {stdio: 'inherit'})
      return
    }

    const favoriteApps = async () => {
      const {body: apps} = await this.heroku.get<Heroku.App[]>('/favorites?type=app', {
        hostname: 'particleboard.heroku.com',
      })
      return apps.map(app => app.resource_name)
    }

    try {
      img(path.join(__dirname, '..', '..', 'assets', 'heroku.png'), {fallback() {}})
    } catch {}

    ux.action.start('Loading')
    const apps = await favoriteApps()
    const [{body: teams}, notificationsResponse, appsWithMoreInfo] = await Promise.all([
      this.heroku.get<Heroku.Team[]>('/teams'),
      this.heroku.get<{ read: boolean }[]>('/user/notifications', {hostname: 'telex.heroku.com'})
        .catch(() => null),
      Promise.all(apps.map(async appID => {
        const [{body: app}, {body: formation}, pipelineResponse] = await Promise.all([
          this.heroku.get<Heroku.App>(`/apps/${appID}`),
          this.heroku.get<Heroku.Formation>(`/apps/${appID}/formation`),
          this.heroku.get<Heroku.PipelineCoupling>(`/apps/${appID}/pipeline-couplings`)
            .catch(() => null),
        ])
        return {
          app, formation, pipeline: pipelineResponse?.body,
        }
      })),
    ])

    const metrics = await fetchMetrics(appsWithMoreInfo, this.heroku)
    ux.action.stop()
    if (apps.length > 0)
      displayApps(appsWithMoreInfo, metrics)
    else
      ux.warn(`Add apps to this dashboard by favoriting them with ${color.code('heroku apps:favorites:add')}`)
    ux.stdout(`See all add-ons with ${color.code('heroku addons')}`)
    const sampleTeam = _.sortBy(teams.filter(o => o.role !== 'collaborator'), o => new Date(o.created_at || ''))[0]
    if (sampleTeam)
      ux.stdout(`See all apps in ${color.team(sampleTeam.name || '')} with ${color.code('heroku apps --team ' + sampleTeam.name)}`)
    ux.stdout(`See all apps with ${color.code('heroku apps --all')}`)
    displayNotifications(notificationsResponse?.body)
    ux.stdout(`\nSee other CLI commands with ${color.code('heroku help')}\n`)
  }
}
