'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const { capitalize } = require('lodash')
const PGDIAGNOSE_HOST = process.env.PGDIAGNOSE_URL || 'https://pgdiagnose.herokai.com'

function * run (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const host = require('../lib/host')
  const util = require('../lib/util')
  const { app, args } = context

  let generateReport = co.wrap(function * (database) {
    let db = yield fetcher.addon(app, database)
    db = yield heroku.get(`/addons/${db.name}`)
    let config = yield heroku.get(`/apps/${app}/config-vars`)
    // TODO: util.getConfigVarName is only providing one of config vars of that
    // addon, we should make sure that we either use the default cred or any
    // cred that associated with the attachment name that was provided to
    // pg:diagnose command
    let params = {
      url: config[util.getConfigVarName(db.config_vars)],
      plan: db.plan.name.split(':')[1],
      app: db.app.name,
      database: util.getConfigVarName(db.config_vars)
    }
    if (!util.starterPlan(db)) {
      params.metrics = yield heroku.get(`/client/v11/databases/${db.id}/metrics`, { host: host(db) })
    }
    return yield heroku.post('/reports', {
      host: PGDIAGNOSE_HOST,
      body: params
    })
  })

  let displayReport = report => {
    cli.log(`Report ${report.id} for ${report.app}::${report.database}
available for one month after creation on ${report.created_at}
`)
    let display = checks => {
      checks.forEach((check) => {
        let color = cli.color[check.status] || ((txt) => txt)
        cli.log(color(`${check.status.toUpperCase()}: ${check.name}`))

        if (check.status === 'green') return
        if (!check.results) return

        if (Array.isArray(check.results)) {
          if (!check.results.length) return

          let keys = Object.keys(check.results[0])
          cli.table(check.results, {
            columns: keys.map(key => ({ label: capitalize(key), key: key }))
          })
        } else {
          if (!Object.keys(check.results).length) return

          let key = Object.keys(check.results)[0]
          cli.log(`${key.split('_').map((s) => capitalize(s)).join(' ')} ${check.results[key]}`)
        }
      })
    }
    display(report.checks.filter(c => c.status === 'red'))
    display(report.checks.filter(c => c.status === 'yellow'))
    display(report.checks.filter(c => c.status === 'green'))
    display(report.checks.filter(c => !['red', 'yellow', 'green'].find(d => d === c.status)))
  }

  let report
  let id = args['DATABASE|REPORT_ID']
  if (id && id.match(/^[a-z0-9-]{36}$/)) {
    report = yield heroku.get(`/reports/${encodeURIComponent(id)}`, { host: PGDIAGNOSE_HOST })
  } else {
    report = yield generateReport(id)
  }

  displayReport(report)
}

module.exports = {
  topic: 'pg',
  command: 'diagnose',
  description: 'run or view diagnostics report',
  help: `
defaults to DATABASE_URL database if no DATABASE is specified
if REPORT_ID is specified instead, a previous report is displayed
`,
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'DATABASE|REPORT_ID', optional: true }],
  run: cli.command({ preauth: true }, co.wrap(run))
}
