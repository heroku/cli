'use strict'

let cli = require('heroku-cli-util')
let time = require('../../time')
const {truncate, sortBy, reduce, forEach} = require('lodash')

// gets the process number from a string like web.19 => 19
let getProcessNum = s => Number.parseInt(s.split('.', 2)[1])

function printExtended(dynos) {
  const trunc = s => truncate(s, {length: 35, omission: '…'})

  dynos = sortBy(dynos, ['type'], a => getProcessNum(a.name))
  cli.table(dynos, {
    columns: [
      {key: 'id', label: 'ID'},
      {key: 'name', label: 'Process'},
      {key: 'state', label: 'State', format: (state, row) => `${state} ${time.ago(new Date(row.updated_at))}`},
      {key: 'extended.region', label: 'Region'},
      {key: 'extended.execution_plane', label: 'Execution Plane'},
      {key: 'extended.fleet', label: 'Fleet'},
      {key: 'extended.instance', label: 'Instance'},
      {key: 'extended.ip', label: 'IP'},
      {key: 'extended.port', label: 'Port'},
      {key: 'extended.az', label: 'AZ'},
      {key: 'release.version', label: 'Release'},
      {key: 'command', label: 'Command', format: trunc},
      {key: 'extended.route', label: 'Route'},
      {key: 'size', label: 'Size'},
    ],
  })
}

async function printAccountQuota(context, heroku, app, account) {
  if (app.process_tier !== 'free' && app.process_tier !== 'eco') {
    return
  }

  if (app.owner.id !== account.id) {
    return
  }

  let quota = await heroku.request({
    path: `/accounts/${account.id}/actions/get-quota`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'},
  })
    .then(function (data) {
    // very temporary fix, the person who can fix this is on vacation
      if (data.id === 'not_found') {
        return null
      }

      return data
    })
    .catch(function () {
      return null
    })

  if (!quota) return

  let remaining = (quota.account_quota === 0) ? 0 : quota.account_quota - quota.quota_used
  let percentage = (quota.account_quota === 0) ? 0 : Math.floor(remaining / quota.account_quota * 100)
  let remainingMinutes = remaining / 60
  let hours = Math.floor(remainingMinutes / 60)
  let minutes = Math.floor(remainingMinutes % 60)

  let appQuota = quota.apps.find(appQuota => {
    return appQuota.app_uuid === app.id
  })
  let appQuotaUsed = appQuota ? appQuota.quota_used / 60 : 0
  let appPercentage = appQuota ? Math.floor(appQuota.quota_used * 100 / quota.account_quota) : 0
  let appHours = Math.floor(appQuotaUsed / 60)
  let appMinutes = Math.floor(appQuotaUsed % 60)

  if (app.process_tier === 'eco') {
    cli.log(`Eco dyno hours quota remaining this month: ${hours}h ${minutes}m (${percentage}%)`)
    cli.log(`Eco dyno usage for this app: ${appHours}h ${appMinutes}m (${appPercentage}%)`)
    cli.log('For more information on Eco dyno hours, see:')
    cli.log('https://devcenter.heroku.com/articles/eco-dyno-hours')
    cli.log()
  }

  if (app.process_tier === 'free') {
    cli.log(`Free dyno hours quota remaining this month: ${hours}h ${minutes}m (${percentage}%)`)
    cli.log(`Free dyno usage for this app: ${appHours}h ${appMinutes}m (${appPercentage}%)`)
    cli.log('For more information on dyno sleeping and how to upgrade, see:')
    cli.log('https://devcenter.heroku.com/articles/dyno-sleeping')
    cli.log()
  }
}

function printDynos(dynos) {
  let dynosByCommand = reduce(dynos, function (dynosByCommand, dyno) {
    let since = time.ago(new Date(dyno.updated_at))
    // eslint-disable-next-line unicorn/explicit-length-check
    let size = dyno.size || '1X'

    if (dyno.type === 'run') {
      let key = `${cli.color.green('run')}: one-off processes`
      if (dynosByCommand[key] === undefined) dynosByCommand[key] = []
      let state = dyno.state === 'up' ? cli.color.green(dyno.state) : cli.color.yellow(dyno.state)
      dynosByCommand[key].push(`${dyno.name} (${cli.color.cyan(size)}): ${state} ${cli.color.dim(since)}: ${dyno.command}`)
    } else {
      let key = `${cli.color.green(dyno.type)} (${cli.color.cyan(size)}): ${dyno.command}`
      if (dynosByCommand[key] === undefined) dynosByCommand[key] = []
      let state = dyno.state === 'up' ? cli.color.green(dyno.state) : cli.color.yellow(dyno.state)
      let item = `${dyno.name}: ${cli.color.green(state)} ${cli.color.dim(since)}`
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

async function run(context, heroku) {
  const {app, flags, args} = context
  const types = args
  const {json, extended} = flags
  const suffix = extended ? '?extended=true' : ''

  let promises = {
    dynos: heroku.request({path: `/apps/${app}/dynos${suffix}`}),
  }

  promises.appInfo = heroku.request({
    path: `/apps/${app}`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.process-tier'},
  })
  promises.accountInfo = heroku.request({path: '/account'})

  let [dynos, appInfo, accountInfo] = await Promise.all([
    promises.dynos,
    promises.appInfo,
    promises.accountInfo,
  ])
  const shielded = appInfo.space && appInfo.space.shield

  if (shielded) {
    dynos.forEach(d => {
      d.size = d.size.replace('Private-', 'Shield-')
    })
  }

  if (types.length > 0) {
    dynos = dynos.filter(dyno => types.find(t => dyno.type === t))
    types.forEach(t => {
      if (!dynos.find(d => d.type === t)) {
        throw new Error(`No ${cli.color.cyan(t)} dynos on ${cli.color.app(app)}`)
      }
    })
  }

  let compare = function (a, b) {
    let comparison = 0
    if (a > b) {
      comparison = 1
    } else if (b > a) {
      comparison = -1
    }

    return comparison
  }

  dynos = dynos.sort((a, b) => compare(a.name, b.name))
  if (json) cli.styledJSON(dynos)
  else if (extended) printExtended(dynos)
  else {
    await printAccountQuota(context, heroku, appInfo, accountInfo)
    if (dynos.length === 0) cli.log(`No dynos on ${cli.color.app(app)}`)
    else printDynos(dynos)
  }
}

module.exports = {
  topic: 'ps',
  description: 'list dynos for an app',
  variableArgs: true,
  usage: 'ps [TYPE [TYPE ...]]',
  flags: [
    {name: 'json', description: 'display as json'},
    {name: 'extended', char: 'x', hidden: true},
  ],
  examples: `$ heroku ps
=== run: one-off dyno
run.1: up for 5m: bash

=== web: bundle exec thin start -p $PORT
web.1: created for 30s

$ heroku ps run # specifying types
=== run: one-off dyno
run.1: up for 5m: bash`,
  needsAuth: true,
  needsApp: true,
  run: cli.command(run),
}
