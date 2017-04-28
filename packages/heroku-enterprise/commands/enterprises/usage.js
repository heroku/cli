let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * usage(context, heroku) {
  let enterpriseAccount = context.flags['enterprise-account']
  let startDate = context.flags['start-date'] || null
  let endDate = context.flags['end-date'] || null

  let query = { start_date: startDate, end_date: endDate }
  let usage = yield heroku.request({
    path: `/enterprise-accounts/${enterpriseAccount}/usage`,
    queryString: query
  })

  if (!usage['teams'] || usage['teams'].length == 0) {
    console.log(`No usage for ${enterpriseAccount}`)
    return
  }

  let data = []
  usage['teams'].forEach((team) => {
    if (!team.apps || team.apps.length === 0) {
      data.push({
        accountName: usage['name'],
        teamName: team['name']
      })
    } else {
      team.apps.forEach((app) => {
        data.push({
          accountName: usage['name'],
          teamName: team['name'],
          appName: app['app_name'],
          addons: app['addons'],
          connect: app['connect'],
          data: app['data'],
          dynos: app['dynos'],
          partner: app['partner']
        })
      })
    }
  })

  let columns = [
    { key: 'accountName', label: 'Account', format: e => cli.color.cyan(e) },
    { key: 'teamName', label: 'Team', format: e => cli.color.green(e) },
    { key: 'appName', label: 'App', format: e => cli.color.green(e) },
    { key: 'addons', label: 'Addon Usage', format: e => cli.color.green(e) },
    { key: 'connect', label: 'Connect Usage', format: e => cli.color.green(e) },
    { key: 'data', label: 'Data Usage', format: e => cli.color.green(e) },
    { key: 'dynos', label: 'Dyno Usage', format: e => cli.color.green(e) },
    { key: 'partner', label: 'Partner Usage', format: e => cli.color.green(e) }
  ]

  cli.table(data, { columns: columns })
}

module.exports = {
  topic: 'enterprises',
  command: 'usage',
  description: 'list the usage for an enterprise account',
  needsAuth: true,
  flags: [
    {
      name: 'enterprise-account',
      description: 'enterprise account name',
      hasValue: true,
      required: true
    },
    {
      name: 'start-date',
      description: 'start date of the usage period',
      hasValue: true,
      required: false
    },
    {
      name: 'end-date',
      description: 'end date of the usage period',
      hasValue: true,
      required: false
    },
  ],
  run: cmd.run(usage)
}
