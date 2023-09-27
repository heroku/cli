'use strict'

const cli = require('heroku-cli-util')
const {capitalize} = require('lodash')
const PGDIAGNOSE_HOST = process.env.PGDIAGNOSE_URL || 'https://pgdiagnose.herokai.com'

async function run(context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const host = require('../lib/host')
  const util = require('../lib/util')
  const URL = require('url')
  const uuid = require('uuid')

  const {app, args, flags} = context

  let generateParams = async function (url, db, dbName) {
    let base_params = {
      url: URL.format(url),
      plan: db.plan.name.split(':')[1],
      app: db.app.name,
      database: dbName,
    }

    if (!util.essentialPlan(db)) {
      base_params.metrics = await heroku.get(`/client/v11/databases/${db.id}/metrics`, {host: host()})
      let burstData = await heroku.get(`/client/v11/databases/${db.id}/burst_status`, {host: host()})
      if (burstData && Object.keys(burstData).length > 0) {
        base_params.burst_data_present = true
        base_params.burst_status = burstData.burst_status
      }
    }

    return base_params
  }

  let generateReport = async function (database) {
    let attachment = await fetcher.attachment(app, database)
    const {addon: db} = attachment
    let config = await heroku.get(`/apps/${app}/config-vars`)

    const {url} = util.getConnectionDetails(attachment, config)
    const dbName = util.getConfigVarNameFromAttachment(attachment, config)

    let params = await generateParams(url, db, dbName)
    return await heroku.post('/reports', {
      host: PGDIAGNOSE_HOST,
      body: params,
    })
  }

  let displayReport = report => {
    if (flags.json) {
      cli.styledJSON(report)
      return
    }

    cli.log(`Report ${report.id} for ${report.app}::${report.database}
available for one month after creation on ${report.created_at}
`)
    let display = checks => {
      checks.forEach(check => {
        let color = cli.color[check.status] || (txt => txt)
        cli.log(color(`${check.status.toUpperCase()}: ${check.name}`))

        if (check.status === 'green') return
        if (!check.results) return

        if (Array.isArray(check.results)) {
          if (check.results.length === 0) return

          let keys = Object.keys(check.results[0])
          cli.table(check.results, {
            columns: keys.map(key => ({label: capitalize(key), key: key})),
          })
        } else {
          if (Object.keys(check.results).length === 0) return

          let key = Object.keys(check.results)[0]
          cli.log(
            `${key
              .split('_')
              .map(s => capitalize(s))
              .join(' ')} ${check.results[key]}`,
          )
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
  if (id && uuid.validate(id)) {
    report = await heroku.get(`/reports/${encodeURIComponent(id)}`, {host: PGDIAGNOSE_HOST})
  } else {
    report = await generateReport(id)
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
  args: [{name: 'DATABASE|REPORT_ID', optional: true}],
  flags: [{name: 'json', description: 'format output as JSON', hasValue: false}],
  run: cli.command({preauth: true}, run),
}
