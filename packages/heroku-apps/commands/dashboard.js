'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let time = require('../lib/time')
let _ = require('lodash')

let empty = (o) => Object.keys(o).length === 0

function displayFormation (formation) {
  formation = _.groupBy(formation, 'size')
  formation = _.map(formation, (p, size) => `${cli.color.yellow(_.sumBy(p, 'quantity'))}:${cli.color.cyan(size)}`)
  cli.log(`  Dynos: ${formation.join(' ')}`)
}

function displayErrors (metrics) {
  let errors = []
  if (metrics.routerErrors) {
    errors = errors.concat(_.toPairs(metrics.routerErrors.data).map((e) => cli.color.red(`${_.sum(e[1])} ${e[0]}`)))
  }
  if (metrics.dynoErrors) {
    metrics.dynoErrors.filter((d) => d).forEach((dynoErrors) => {
      errors = errors.concat(_.toPairs(dynoErrors.data).map((e) => cli.color.red(`${_.sum(e[1])} ${e[0]}`)))
    })
  }
  if (errors.length > 0) cli.log(`  ${errors.join(', ')} - see details with ${cli.color.yellow('heroku apps:errors')}`)
}

function displayMetrics (metrics) {
  function rpmSparkline () {
    if (process.platform === 'win32') return
    let sparkline = require('sparkline')
    let points = []
    _.values(metrics.routerStatus.data).forEach((cur) => {
      for (let i = 0; i < cur.length; i++) {
        let j = Math.floor(i / 3)
        points[j] = (points[j] || 0) + cur[i]
      }
    })
    points.pop()
    return sparkline(points) + ' last 24 hours rpm'
  }
  let ms = ''
  let rpm = ''
  if (metrics.routerLatency && !empty(metrics.routerLatency.data)) {
    ms = _.pad(`${_.round(_.mean(metrics.routerLatency.data.latency_p50))} ms`, 6)
  }
  if (metrics.routerStatus && !empty(metrics.routerStatus.data)) {
    rpm = `${_.round(_.sum(_.flatten(_.values(metrics.routerStatus.data))) / 24 / 60)} rpm ${rpmSparkline()}`
  }
  if (rpm || ms) cli.log(`  ${cli.color.green(ms)} ${cli.color.yellow(rpm)}`)
}

function displayNotifications (notifications) {
  notifications = notifications.filter((n) => !n.read)
  if (notifications.length > 0) {
    cli.log(cli.color.yellow(`
You have ${notifications.length} unread notifications. Read them with ${cli.color.cmd('heroku notifications')}`))
  }
}

function displayApps (apps, appsMetrics) {
  let owner = (owner) => owner.email.endsWith('@herokumanager.com') ? owner.email.split('@')[0] : owner.email

  for (let a of _.zip(apps, appsMetrics)) {
    cli.log()
    let app = a[0]
    let metrics = a[1]
    cli.log(cli.color.app(app.app.name))
    let pipeline = app.pipeline ? ` Pipeline: ${cli.color.blue.bold(app.pipeline.pipeline.name)}` : ''
    cli.log(`  Owner: ${cli.color.blue.bold(owner(app.app.owner))}${pipeline}`)
    displayFormation(app.formation)
    cli.log(`  Last release: ${cli.color.green(time.ago(new Date(app.app.released_at)))}`)
    displayMetrics(metrics)
    displayErrors(metrics)
  }
}

function * run (context, heroku) {
  function favoriteApps () {
    return heroku.request({
      host: 'longboard.heroku.com',
      path: '/favorites',
      headers: {Range: ''}
    }).then((apps) => apps.map((app) => app.app_name))
  }

  function fetchMetrics (apps) {
    const NOW = new Date().toISOString()
    const YESTERDAY = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    let date = `start_time=${YESTERDAY}&end_time=${NOW}&step=1h`
    return apps.map((app) => {
      let types = app.formation.map((p) => p.type)
      return {
        dynoErrors: types.map((type) => heroku.request({host: 'api.metrics.herokai.com', path: `/apps/${app.app.name}/formation/${type}/metrics/errors?${date}`, headers: {Range: ''}}).catch(() => null)),
        routerLatency: heroku.request({host: 'api.metrics.herokai.com', path: `/apps/${app.app.name}/router-metrics/latency?${date}&process_type=${types[0]}`, headers: {Range: ''}}).catch(() => null),
        routerErrors: heroku.request({host: 'api.metrics.herokai.com', path: `/apps/${app.app.name}/router-metrics/errors?${date}&process_type=${types[0]}`, headers: {Range: ''}}).catch(() => null),
        routerStatus: heroku.request({host: 'api.metrics.herokai.com', path: `/apps/${app.app.name}/router-metrics/status?${date}&process_type=${types[0]}`, headers: {Range: ''}}).catch(() => null)
      }
    })
  }

  let apps, data, metrics

  yield cli.action('Loading', {success: false}, co(function * () {
    apps = yield favoriteApps()

    data = yield {
      orgs: heroku.request({path: '/organizations'}),
      notifications: heroku.request({host: 'telex.heroku.com', path: '/user/notifications'}),
      apps: apps.map((app) => ({
        app: heroku.get(`/apps/${app}`),
        formation: heroku.get(`/apps/${app}/formation`),
        pipeline: heroku.get(`/apps/${app}/pipeline-couplings`).catch(() => null)
      }))
    }
    metrics = yield fetchMetrics(data.apps)
  }))

  process.stderr.write('\r')
  if (process.stderr.clearLine) process.stderr.clearLine()
  else cli.console.error('\n')

  if (apps.length > 0) displayApps(data.apps, metrics)
  else cli.warn(`Add apps to this dashboard by favoriting them with ${cli.color.cmd('heroku apps:favorites:add')}`)

  cli.log(`
See all add-ons with ${cli.color.cmd('heroku addons')}`)
  let sampleOrg = _.sortBy(data.orgs.filter((o) => o.role !== 'collaborator'), (o) => new Date(o.created_at))[0]
  if (sampleOrg) cli.log(`See all apps in ${cli.color.cmd(sampleOrg.name)} with ${cli.color.cmd('heroku apps --org ' + sampleOrg.name)}`)
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
  wantsOrg: true,
  run: cli.command(co.wrap(run))
}
