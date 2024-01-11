import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

let cli = require('heroku-cli-util')
let time = require('../../time')
const {truncate, sortBy, reduce, forEach} = require('lodash')
let getProcessNum = s => Number.parseInt(s.split('.', 2)[1])
function printExtended(dynos) {
  const trunc = s => truncate(s, {length: 35, omission: '\u2026'})
  dynos = sortBy(dynos, ['type'], a => getProcessNum(a.name))
  cli.table(dynos, {
    columns: [
      {key: 'id', label: 'ID'}, {key: 'name', label: 'Process'}, {key: 'state', label: 'State', format: (state, row) => `${state} ${time.ago(new Date(row.updated_at))}`}, {key: 'extended.region', label: 'Region'}, {key: 'extended.execution_plane', label: 'Execution Plane'}, {key: 'extended.fleet', label: 'Fleet'}, {key: 'extended.instance', label: 'Instance'}, {key: 'extended.ip', label: 'IP'}, {key: 'extended.port', label: 'Port'}, {key: 'extended.az', label: 'AZ'}, {key: 'release.version', label: 'Release'}, {key: 'command', label: 'Command', format: trunc}, {key: 'extended.route', label: 'Route'}, {key: 'size', label: 'Size'},
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
    path: `/accounts/${account.id}/actions/get-quota`, headers: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'},
  })
    .then(function (data) {
      if (data.id === 'not_found') {
        return null
      }

      return data
    })
    .catch(function () {
      return null
    })
  if (!quota)
    return
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
    ux.log(`Eco dyno hours quota remaining this month: ${hours}h ${minutes}m (${percentage}%)`)
    ux.log(`Eco dyno usage for this app: ${appHours}h ${appMinutes}m (${appPercentage}%)`)
    ux.log('For more information on Eco dyno hours, see:')
    ux.log('https://devcenter.heroku.com/articles/eco-dyno-hours')
    ux.log()
  }

  if (app.process_tier === 'free') {
    ux.log(`Free dyno hours quota remaining this month: ${hours}h ${minutes}m (${percentage}%)`)
    ux.log(`Free dyno usage for this app: ${appHours}h ${appMinutes}m (${appPercentage}%)`)
    ux.log('For more information on dyno sleeping and how to upgrade, see:')
    ux.log('https://devcenter.heroku.com/articles/dyno-sleeping')
    ux.log()
  }
}

function printDynos(dynos) {
  let dynosByCommand = reduce(dynos, function (dynosByCommand, dyno) {
    let since = time.ago(new Date(dyno.updated_at))
    let size = dyno.size || '1X'
    if (dyno.type === 'run') {
      let key = `${color.green('run')}: one-off processes`
      if (dynosByCommand[key] === undefined)
        dynosByCommand[key] = []
      let state = dyno.state === 'up' ? color.green(dyno.state) : color.yellow(dyno.state)
      dynosByCommand[key].push(`${dyno.name} (${color.cyan(size)}): ${state} ${color.dim(since)}: ${dyno.command}`)
    } else {
      let key = `${color.green(dyno.type)} (${color.cyan(size)}): ${dyno.command}`
      if (dynosByCommand[key] === undefined)
        dynosByCommand[key] = []
      let state = dyno.state === 'up' ? color.green(dyno.state) : color.yellow(dyno.state)
      let item = `${dyno.name}: ${color.green(state)} ${color.dim(since)}`
      dynosByCommand[key].push(item)
    }

    return dynosByCommand
  }, {})
  forEach(dynosByCommand, function (dynos, key) {
    ux.styledHeader(`${key} (${color.yellow(dynos.length)})`)
    dynos = dynos.sort((a, b) => getProcessNum(a) - getProcessNum(b))
    for (let dyno of dynos)
      ux.log(dyno)
    ux.log()
  })
}

export default class Index extends Command {
    static topic = 'ps';
    static description = 'list dynos for an app';
    static strict = false;
    static flags = {
      json: flags.boolean({description: 'display as json'}),
      extended: flags.boolean({char: 'x', hidden: true}),
      app: flags.app({required: true}),
    };

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(Index)
      const {app, flags, args} = context
      const types = args
      const {json, extended} = flags
      const suffix = extended ? '?extended=true' : ''
      let promises = {
        dynos: this.heroku.request({path: `/apps/${app}/dynos${suffix}`}),
      }
      promises.appInfo = this.heroku.request({
        path: `/apps/${app}`, headers: {Accept: 'application/vnd.heroku+json; version=3.process-tier'},
      })
      promises.accountInfo = this.heroku.request({path: '/account'})
      let [dynos, appInfo, accountInfo] = await Promise.all([
        promises.dynos, promises.appInfo, promises.accountInfo,
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
            throw new Error(`No ${color.cyan(t)} dynos on ${color.magenta(app)}`)
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
      if (json)
        ux.styledJSON(dynos)
      else if (extended)
        printExtended(dynos)
      else {
        await printAccountQuota(context, heroku, appInfo, accountInfo)
        if (dynos.length === 0)
          ux.log(`No dynos on ${color.magenta(app)}`)
        else
          printDynos(dynos)
      }
    }
}
