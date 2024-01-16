import color from '@heroku-cli/color'
import {APIClient, Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {round, flatten, mean, groupBy, map, sum, sumBy, sortBy, zip} from 'lodash'
import img = require('term-img')
import path = require('path')
import {execSync} from 'child_process'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sparkline = require('sparkline')
import {ago} from '../lib/time'
import {AppErrors} from '../lib/types/app_errors'
import * as process from 'process'

type AppsWithMoreInfo = {
  app: Heroku.App
  pipeline?: Heroku.PipelineCoupling
  formation: Heroku.Formation
}

type FetchMetricsResponse =  {
  routerLatency?: AppErrors
  routerErrors?: AppErrors
  routerStatus?: AppErrors
  dynoErrors: (AppErrors | undefined)[]
}[]

const empty = (o: Record<string, any>) => Object.keys(o).length === 0

function displayFormation(formation: Heroku.Formation) {
  formation = groupBy(formation, 'size')
  formation = map(formation, (p, size) => `${bold(sumBy(p, 'quantity').toString())} | ${size}`)
  ux.log(`  ${label('Dynos:')} ${formation.join(', ')}`)
}

function displayErrors(metrics: FetchMetricsResponse[0]) {
  let errors: string[] = []
  if (metrics.routerErrors) {
    errors = errors.concat(Object.entries(metrics.routerErrors.data)
      .map(e => color.red(`${sum(e[1])} ${e[0]}`)))
  }

  if (metrics.dynoErrors) {
    metrics.dynoErrors.filter(d => d)
      .forEach(dynoErrors => {
        errors = errors.concat(Object.entries(dynoErrors?.data || {})
          .map(e => color.red(`${sum(e[1])} ${e[0]}`)))
      })
  }

  if (errors.length > 0)
    ux.log(`  ${label('Errors:')} ${errors.join(dim(', '))} (see details with ${color.cyan.bold('heroku apps:errors')})`)
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
      ms = `${round(mean(latency))} ms `
  }

  if (metrics.routerStatus && !empty(metrics.routerStatus.data)) {
    rpm = `${round(sum(flatten(Object.values(metrics.routerStatus.data))) / 24 / 60)} rpm ${rpmSparkline()}`
  }

  if (rpm || ms)
    ux.log(`  ${label('Metrics:')} ${ms}${rpm}`)
}

function displayNotifications(notifications?: {read: boolean}[]) {
  if (!notifications)
    return
  notifications = notifications.filter(n => !n.read)
  if (notifications.length > 0) {
    ux.log(`\nYou have ${color.yellow(notifications.length.toString())} unread notifications. Read them with ${color.cyan.bold('heroku notifications')}`)
  }
}

const dim = (s: string) => color.dim(s)
const bold = (s: string) => color.bold(s)
const label = (s: string) => color.blue(s)

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
    dynoErrors, routerLatency: routerLatency?.body, routerErrors: routerErrors?.body, routerStatus: routerStatus?.body,
  }))
}

// lazy way to get TS to do typing for us

function displayApps(apps: AppsWithMoreInfo[], appsMetrics: FetchMetricsResponse) {
  const owner = (owner: Heroku.App['owner']) => owner?.email?.endsWith('@herokumanager.com') ? owner.email.split('@')[0] : owner?.email
  const zipped = zip(apps, appsMetrics) as [AppsWithMoreInfo, FetchMetricsResponse[0]][]
  for (const a of zipped) {
    const app = a[0]
    const metrics = a[1]
    ux.log(color.magenta(app.app.name || ''))
    ux.log(`  ${label('Owner:')} ${owner(app.app.owner)}`)
    if (app.pipeline) {
      ux.log(`  ${label('Pipeline:')} ${app.pipeline.pipeline?.name}`)
    }

    displayFormation(app.formation)
    ux.log(`  ${label('Last release:')} ${ago(new Date(app.app.released_at || ''))}`)
    displayMetrics(metrics)
    displayErrors(metrics)
    ux.log()
  }
}

export default class Dashboard extends Command {
    static topic = 'dashboard';
    static description = 'display information about favorite apps';
    static hidden = true;
    public async run(): Promise<void> {
      if (!this.heroku.auth && process.env.NODE_ENV !== 'test') {
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
        img(path.join(__dirname, '..', '..', 'assets', 'heroku.png'), {fallback: () => {}})
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
        ux.warn(`Add apps to this dashboard by favoriting them with ${color.cyan.bold('heroku apps:favorites:add')}`)
      ux.log(`See all add-ons with ${color.cyan.bold('heroku addons')}`)
      const sampleTeam = sortBy(teams.filter(o => o.role !== 'collaborator'), o => new Date(o.created_at || ''))[0]
      if (sampleTeam)
        ux.log(`See all apps in ${color.yellow.dim(sampleTeam.name || '')} with ${color.cyan.bold('heroku apps --team ' + sampleTeam.name)}`)
      ux.log(`See all apps with ${color.cyan.bold('heroku apps --all')}`)
      displayNotifications(notificationsResponse?.body)
      ux.log(`\nSee other CLI commands with ${color.cyan.bold('heroku help')}\n`)
    }
}
