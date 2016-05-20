'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let time = require('../../lib/time')

// gets the process number from a string like web.19 => 19
let getProcessNum = (s) => parseInt(s.split('.', 2)[1])

function printQuota (quota) {
  if (!quota) return
  let lbl
  if (quota.allow_until) lbl = 'Free quota left'
  else if (quota.deny_until) lbl = 'Free quota exhausted. Unidle available in'
  if (lbl) {
    let timestamp = quota.allow_until ? new Date(quota.allow_until) : new Date(quota.deny_until)
    let timeRemaining = time.remaining(new Date(), timestamp)
    cli.log(`${lbl}: ${timeRemaining}`)
  }
}

function printExtended (dynos) {
  const truncate = require('lodash.truncate')
  const sortBy = require('lodash.sortby')
  const trunc = (s) => truncate(s, {length: 35, omission: '…'})

  dynos = sortBy(dynos, ['type'], (a) => getProcessNum(a.name))
  cli.table(dynos, {
    columns: [
      {key: 'id', label: 'ID'},
      {key: 'name', label: 'Process'},
      {key: 'state', label: 'State', format: (state, row) => `${state} ${time.ago(new Date(row.updated_at))}`},
      {key: 'extended.region', label: 'Region'},
      {key: 'extended.instance', label: 'Instance'},
      {key: 'extended.port', label: 'Port'},
      {key: 'extended.az', label: 'AZ'},
      {key: 'release.version', label: 'Release'},
      {key: 'command', label: 'Command', format: trunc},
      {key: 'extended.route', label: 'Route'},
      {key: 'size', label: 'Size'}
    ]
  })
}

function * printAccountQuota (context, heroku) {
  let requests = yield {
    app: heroku.request({
      path: `/apps/${context.app}`,
      headers: {Accept: 'application/vnd.heroku+json; version=3.process-tier'}
    }),
    account: heroku.request({path: '/account'})
  }

  if (requests.app.process_tier !== 'free') {
    return
  }

  let quota = yield heroku.request({
    path: `/accounts/${requests.account.id}/actions/get-quota`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'}
  })
  .then(function (data) {
    // very temporary fix, the person who can fix this is on vacation
    if (data.id === 'not_found') {
      return null
    }
    return data
  })
  .catch(function (err) {
    if (err.statusCode === 404 && err.body && err.body.id === 'not_found') {
      return null
    }
    throw err
  })

  if (!quota) return

  let remaining, percentage
  if (quota.account_quota === 0) {
    remaining = 0
    percentage = 0
  } else {
    remaining = quota.account_quota - quota.quota_used
    percentage = Math.floor(remaining / quota.account_quota * 100)
  }

  cli.log(`Free dyno hours quota remaining this month: ${remaining} hrs (${percentage}%)`)
  cli.log('For more information on dyno sleeping and how to upgrade, see:')
  cli.log('https://devcenter.heroku.com/articles/dyno-sleeping')
  cli.log()
}

function printDynos (dynos) {
  const reduce = require('lodash.reduce')
  const forEach = require('lodash.foreach')

  let dynosByCommand = reduce(dynos, function (dynosByCommand, dyno) {
    let since = time.ago(new Date(dyno.updated_at))
    let size = dyno.size || '1X'

    if (dyno.type === 'run') {
      let key = 'run: one-off processes'
      if (dynosByCommand[key] === undefined) dynosByCommand[key] = []
      dynosByCommand[key].push(`${dyno.name} (${size}): ${dyno.state} ${since}: ${dyno.command}`)
    } else {
      let key = `${cli.color.green(dyno.type)} (${cli.color.cyan(size)}): ${dyno.command}`
      if (dynosByCommand[key] === undefined) dynosByCommand[key] = []
      let state = dyno.state === 'up' ? cli.color.green(dyno.state) : cli.color.yellow(dyno.state)
      let item = `${dyno.name}: ${cli.color.green(state)} ${cli.color.gray(since)}`
      dynosByCommand[key].push(item)
    }
    return dynosByCommand
  }, {})
  forEach(dynosByCommand, function (dynos, key) {
    cli.styledHeader(`${key} (${cli.color.yellow(dynos.length)})`)
    dynos = dynos.sort((a, b) => getProcessNum(a) - getProcessNum(b))
    for (let dyno of dynos) cli.log(dyno)
    cli.log()
  })
}

function * run (context, heroku) {
  let suffix = context.flags.extended ? '?extended=true' : ''

  let feature = heroku.request({path: '/account/features/free-2016'})
    .catch(function (err) {
      if (err.statusCode === 404 && err.body && err.body.id === 'not_found') {
        return {enabled: false}
      }
      throw err
    })

  let data = yield {
    quota: heroku.request({
      path: `/apps/${context.app}/actions/get-quota${suffix}`,
      method: 'post', headers: {Accept: 'application/vnd.heroku+json; version=3.app-quotas'}
    }).catch(() => {
    }),
    dynos: heroku.request({path: `/apps/${context.app}/dynos${suffix}`}),
    feature
  }

  let type = context.args.type
  if (type) {
    data.dynos = data.dynos.filter(dyno => dyno.type === type)
  }

  if (context.flags.json) {
    cli.styledJSON(data.dynos)
  } else if (context.flags.extended) {
    printExtended(data.dynos)
  } else {
    if (data.feature.enabled) {
      yield printAccountQuota(context, heroku)
    } else {
      printQuota(data.quota)
    }
    printDynos(data.dynos)
  }
}

module.exports = {
  topic: 'ps',
  description: 'list dynos for an app',
  args: [{name: 'type', optional: true}],
  flags: [
    {name: 'json', description: 'display as json'},
    {name: 'extended', char: 'x', hidden: true}
  ],
  help: `
Example:

 $ heroku ps
 === run: one-off dyno
 run.1: up for 5m: bash

 === web: bundle exec thin start -p $PORT
 web.1: created for 30s`,
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}
