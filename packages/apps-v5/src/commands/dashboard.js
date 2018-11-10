'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const { round, flatten, mean, groupBy, map, sum, sumBy, toPairs, sortBy, zip } = require('lodash')

let empty = (o) => Object.keys(o).length === 0

function displayFormation (formation) {
  formation = groupBy(formation, 'size')
  formation = map(formation, (p, size) => `${bold(sumBy(p, 'quantity'))} | ${size}`)
  cli.log(`  ${label('Dynos:')} ${formation.join(', ')}`)
}

function displayErrors (metrics) {
  let errors = []
  if (metrics.routerErrors) {
    errors = errors.concat(toPairs(metrics.routerErrors.data).map((e) => cli.color.red(`${sum(e[1])} ${e[0]}`)))
  }
  if (metrics.dynoErrors) {
    metrics.dynoErrors.filter((d) => d).forEach((dynoErrors) => {
      errors = errors.concat(toPairs(dynoErrors.data).map((e) => cli.color.red(`${sum(e[1])} ${e[0]}`)))
    })
  }
  if (errors.length > 0) cli.log(`  ${label('Errors:')} ${errors.join(dim(', '))} (see details with ${cli.color.cmd('heroku apps:errors')})`)
}

function displayMetrics (metrics) {
  function rpmSparkline () {
    if (['win32', 'windows'].includes(process.platform)) return ''
    let sparkline = require('sparkline')
    let points = []
    Object.values(metrics.routerStatus.data).forEach((cur) => {
      for (let i = 0; i < cur.length; i++) {
        let j = Math.floor(i / 3)
        points[j] = (points[j] || 0) + cur[i]
      }
    })
    points.pop()
    return dim(sparkline(points)) + ' last 24 hours rpm'
  }
  let ms = ''
  let rpm = ''
  if (metrics.routerLatency && !empty(metrics.routerLatency.data)) {
    let latency = metrics.routerLatency.data['latency.ms.p50']
    if (!empty(latency)) ms = `${round(mean(latency))} ms `
  }
  if (metrics.routerStatus && !empty(metrics.routerStatus.data)) {
    rpm = `${round(sum(flatten(Object.values(metrics.routerStatus.data))) / 24 / 60)} rpm ${rpmSparkline()}`
  }
  if (rpm || ms) cli.log(`  ${label('Metrics:')} ${ms}${rpm}`)
}

function displayNotifications (notifications) {
  if (!notifications) return

  notifications = notifications.filter((n) => !n.read)
  if (notifications.length > 0) {
    cli.log(`
You have ${cli.color.yellow(notifications.length)} unread notifications. Read them with ${cli.color.cmd('heroku notifications')}`)
  }
}

let dim = (s) => cli.color.dim(s)
let bold = (s) => cli.color.bold(s)
let label = (s) => cli.color.blue(s)

function displayApps (apps, appsMetrics) {
  const time = require('../time')

  let owner = (owner) => owner.email.endsWith('@herokumanager.com') ? owner.email.split('@')[0] : owner.email

  for (let a of zip(apps, appsMetrics)) {
    let app = a[0]
    let metrics = a[1]
    cli.log(cli.color.app(app.app.name))
    cli.log(`  ${label('Owner:')} ${owner(app.app.owner)}`)
    if (app.pipeline) {
      cli.log(`  ${label('Pipeline:')} ${app.pipeline.pipeline.name}`)
    }
    displayFormation(app.formation)
    cli.log(`  ${label('Last release:')} ${time.ago(new Date(app.app.released_at))}`)
    displayMetrics(metrics)
    displayErrors(metrics)
    cli.log()
  }
}

function * run (context, heroku) {
  const img = require('term-img')
  const path = require('path')

  // if not testing and not logged in
  if (!cli.raiseErrors && (!context.auth || !context.auth.password)) {
    let { execSync } = require('child_process')
    execSync('heroku help', { stdio: 'inherit' })
    return
  }

  function favoriteApps () {
    return heroku.request({
      host: 'particleboard.heroku.com',
      path: '/favorites?type=app',
      headers: { Range: '' }
    }).then((apps) => apps.map((app) => app.app_name))
  }

  function fetchMetrics (apps) {
    const NOW = new Date().toISOString()
    const YESTERDAY = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    let date = `start_time=${YESTERDAY}&end_time=${NOW}&step=1h`
    return apps.map((app) => {
      let types = app.formation.map((p) => p.type)
      return {
        dynoErrors: types.map((type) => heroku.request({ host: 'api.metrics.herokai.com', path: `/apps/${app.app.name}/formation/${type}/metrics/errors?${date}`, headers: { Range: '' } }).catch(() => null)),
        routerLatency: heroku.request({ host: 'api.metrics.herokai.com', path: `/apps/${app.app.name}/router-metrics/latency?${date}&process_type=${types[0]}`, headers: { Range: '' } }).catch(() => null),
        routerErrors: heroku.request({ host: 'api.metrics.herokai.com', path: `/apps/${app.app.name}/router-metrics/errors?${date}&process_type=${types[0]}`, headers: { Range: '' } }).catch(() => null),
        routerStatus: heroku.request({ host: 'api.metrics.herokai.com', path: `/apps/${app.app.name}/router-metrics/status?${date}&process_type=${types[0]}`, headers: { Range: '' } }).catch(() => null)
      }
    })
  }

  let apps, data, metrics

  try {
    img(path.join(__dirname, '..', '..', 'assets', 'heroku.png'), { fallback: () => {} })
  } catch (err) { }

  yield cli.action('Loading', { clear: true }, co(function * () {
    apps = yield favoriteApps()

    data = yield {
      orgs: heroku.request({ path: '/organizations' }),
      notifications: heroku.request({ host: 'telex.heroku.com', path: '/user/notifications' }).catch(() => null),
      apps: apps.map((app) => ({
        app: heroku.get(`/apps/${app}`),
        formation: heroku.get(`/apps/${app}/formation`),
        pipeline: heroku.get(`/apps/${app}/pipeline-couplings`).catch(() => null)
      }))
    }
    metrics = yield fetchMetrics(data.apps)
  }))

  if (apps.length > 0) displayApps(data.apps, metrics)
  else cli.warn(`Add apps to this dashboard by favoriting them with ${cli.color.cmd('heroku apps:favorites:add')}`)

  cli.log(`See all add-ons with ${cli.color.cmd('heroku addons')}`)
  let sampleOrg = sortBy(data.orgs.filter((o) => o.role !== 'collaborator'), (o) => new Date(o.created_at))[0]
  if (sampleOrg) cli.log(`See all apps in ${cli.color.yellow.dim(sampleOrg.name)} with ${cli.color.cmd('heroku apps --team ' + sampleOrg.name)}`)
  cli.log(`See all apps with ${cli.color.cmd('heroku apps --all')}`)
  displayNotifications(data.notifications)
  cli.log(`
See other CLI commands with ${cli.color.cmd('heroku help')}
`)
}

module.exports = {
  topic: 'dashboard',
  description: 'display information about favorite apps',
  hidden: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
