import {Command} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {App, Formation, PipelineCoupling} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'
import {execFileSync} from 'node:child_process'
import path from 'node:path'
import * as process from 'node:process'
import {fileURLToPath} from 'node:url'
import img from 'term-img'

import {lazyModuleLoader} from '../lib/lazy-module-loader.js'
import {ago} from '../lib/time.js'
import {AppErrors} from '../lib/types/app-errors.js'
import {sparkline} from '../lib/utils/sparkline.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type Metrics = HerokuSDK['metrics']

// `GET /apps/{id}/pipeline-couplings` returns the coupled pipeline's name, but
// the strict @heroku/types schema only declares `pipeline.id`. Widen it here
// until the upstream type catches up (see V12 SDK migration).
type PipelineCouplingWithName = Omit<PipelineCoupling, 'pipeline'> & {
  pipeline?: {id?: string; name?: string}
}

type AppsWithMoreInfo = {
  app: App
  formation: Formation[]
  pipeline?: PipelineCouplingWithName
}

type FetchMetricsResponse =  {
  dynoErrors: (AppErrors | undefined)[]
  routerErrors?: AppErrors
  routerLatency?: AppErrors
  routerStatus?: AppErrors
}[]

const empty = (o: Record<string, any>) => Object.keys(o).length === 0

function displayErrors(metrics: FetchMetricsResponse[0], _: any) {
  let errors: string[] = []
  if (metrics.routerErrors) {
    errors = errors.concat(Object.entries(metrics.routerErrors.data)
      .map(e => color.failure(`${_.sum(e[1])} ${e[0]}`)))
  }

  if (metrics.dynoErrors) {
    for (const dynoErrors of metrics.dynoErrors.filter(Boolean)) {
      errors = errors.concat(Object.entries(dynoErrors?.data || {})
        .map(e => color.failure(`${_.sum(e[1])} ${e[0]}`)))
    }
  }

  if (errors.length > 0)
    ux.stdout(`  ${label('Errors:')} ${errors.join(dim(', '))} (see details with ${color.code('heroku apps:errors')})`)
}

function displayFormation(formation: Formation[], _: any) {
  const grouped = _.groupBy(formation, 'size')
  const sizes = _.map(grouped, (p: any, size: string) => `${bold(_.sumBy(p, 'quantity').toString())} | ${size}`)
  ux.stdout(`  ${label('Dynos:')} ${sizes.join(', ')}`)
}

function displayMetrics(metrics: FetchMetricsResponse[0], _: any) {
  function rpmSparkline() {
    if (['win32', 'windows'].includes(process.platform))
      return ''
    const points: number[] = []
    for (const cur of Object.values(metrics.routerStatus?.data || {})) {
      for (const [i, element] of cur.entries()) {
        const j = Math.floor(i / 3)
        points[j] = (points[j] || 0) + element
      }
    }

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
    ux.stdout(`\nYou have ${color.yellow(notifications.length.toString())} unread notifications. Read them with ${color.code('heroku notifications')}`)
  }
}

const dim = (s: string) => color.gray(s)
const bold = (s: string) => color.bold(s)
const label = (s: string) => color.label(s)

const fetchMetrics = async (apps: AppsWithMoreInfo[], metrics: Metrics): Promise<FetchMetricsResponse> => {
  const NOW = new Date().toISOString()
  const YESTERDAY = new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString()
  const query = {end_time: NOW, start_time: YESTERDAY, step: '1h'}

  const metricsData = await Promise.all(apps.map(app => {
    const types = app.formation.map(p => p.type)
    const dynoErrorsPromise = Promise.all(types.map(type =>
      metrics.formationMetric.errors(app.app.name, type, query).catch(() => {})))
    return Promise.all([
      dynoErrorsPromise,
      metrics.routerMetric.latency(app.app.name, {...query, process_type: types[0]}).catch(() => {}),
      metrics.routerMetric.errors(app.app.name, {...query, process_type: types[0]}).catch(() => {}),
      metrics.routerMetric.status(app.app.name, {...query, process_type: types[0]}).catch(() => {}),
    ])
  }))

  return metricsData.map(([dynoErrors, routerLatency, routerErrors, routerStatus]) => ({
    dynoErrors: dynoErrors as (AppErrors | undefined)[],
    routerErrors: routerErrors as AppErrors | undefined,
    routerLatency: routerLatency as AppErrors | undefined,
    routerStatus: routerStatus as AppErrors | undefined,
  }))
}

export default class Dashboard extends Command {
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'display information about favorite apps'
  static hidden = true
  static promptFlagActive = false
  static topic = 'dashboard'

  public async run(): Promise<AppsWithMoreInfo[] | void> {
    const {dashboardBackend, metrics, notifications, platform} = new HerokuSDK()
    const _ = await lazyModuleLoader.loadLodash()

    if (!this.heroku.auth && process.env.IS_HEROKU_TEST_ENV !== 'true') {
      execFileSync('heroku', ['help'], {stdio: 'inherit'})
      return
    }

    const favoriteApps = async () => {
      const favorites = await dashboardBackend.favorite.list({type: 'app'})
      return favorites.map(favorite => favorite.resource_name)
    }

    try {
      const imagePath = path.join(__dirname, '..', '..', 'assets', 'heroku.png')
      let image = img(imagePath, {fallback() {}})
      if (image) {
        // Add filename to iTerm2 inline image protocol for better permission prompts
        // Format: ]1337;File=name=<base64>;inline=1;size=...
        const filename = 'heroku.png'
        const nameBase64 = Buffer.from(filename).toString('base64')
        image = image.replace('File=inline=1;', `File=name=${nameBase64};inline=1;`)
        ux.stdout(image)
        ux.stdout('\n')
      }
    } catch {
      // Image display not supported in this terminal
    }

    ux.action.start('Loading')
    const apps = await favoriteApps()
    const [teams, notificationsResponse, appsWithMoreInfo] = await Promise.all([
      platform.team.list(),
      notifications.notification.list().catch(() => null),
      Promise.all(apps.map(async appID => {
        const [app, formation, pipeline] = await Promise.all([
          platform.app.info(appID),
          platform.formation.list(appID),
          platform.pipelineCoupling.infoByApp(appID)
            .catch(() => null),
        ])
        return {
          app, formation, pipeline: pipeline ?? undefined,
        }
      })),
    ])

    const metricsData = await fetchMetrics(appsWithMoreInfo, metrics)
    ux.action.stop()
    if (apps.length > 0)
      displayApps(appsWithMoreInfo, metricsData, _)
    else
      ux.warn(`Add apps to this dashboard by favoriting them with ${color.code('heroku apps:favorites:add')}`)
    ux.stdout(`See all add-ons with ${color.code('heroku addons')}`)
    const sampleTeam = _.sortBy(teams.filter(o => o.role !== 'collaborator'), o => new Date(o.created_at || ''))[0]
    if (sampleTeam)
      ux.stdout(`See all apps in ${color.team(sampleTeam.name || '')} with ${color.code('heroku apps --team ' + sampleTeam.name)}`)
    ux.stdout(`See all apps with ${color.code('heroku apps --all')}`)
    displayNotifications(notificationsResponse ?? undefined)
    ux.stdout(`\nSee other CLI commands with ${color.code('heroku help')}\n`)

    return appsWithMoreInfo
  }
}

function displayApps(apps: AppsWithMoreInfo[], appsMetrics: FetchMetricsResponse, _: any) {
  const getOwner = (owner: App['owner']) => owner?.email?.endsWith('@herokumanager.com') ? owner.email.split('@')[0] : owner?.email
  const zipped = _.zip(apps, appsMetrics) as [AppsWithMoreInfo, FetchMetricsResponse[0]][]
  for (const a of zipped) {
    const app = a[0]
    const metrics = a[1]
    hux.styledHeader(color.app(app.app.name || ''))
    ux.stdout(`  ${label('Owner:')} ${color.user(getOwner(app.app.owner) || '')}`)
    if (app.pipeline) {
      ux.stdout(`  ${label('Pipeline:')} ${color.pipeline(app.pipeline.pipeline?.name || '')}`)
    }

    displayFormation(app.formation, _)
    ux.stdout(`  ${label('Last release:')} ${ago(new Date(app.app.released_at || ''))}`)
    displayMetrics(metrics, _)
    displayErrors(metrics, _)
    ux.stdout()
  }
}
