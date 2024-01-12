import color from '@heroku-cli/color'
import {Command, flags, APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import * as time from '../../lib/utils/time'

const cli = require('heroku-cli-util')
const {truncate, sortBy, reduce, forEach} = require('lodash')
const getProcessNum = s => Number.parseInt(s.split('.', 2)[1])
function printExtended(dynos: Heroku.Dyno) {
  const trunc = s => truncate(s, {length: 35, omission: '\u2026'})
  dynos = sortBy(dynos, ['type'], a => getProcessNum(a.name))
  cli.table(dynos, {
    columns: [
      {key: 'id', label: 'ID'}, {key: 'name', label: 'Process'}, {key: 'state', label: 'State', format: (state, row) => `${state} ${time.ago(new Date(row.updated_at))}`}, {key: 'extended.region', label: 'Region'}, {key: 'extended.execution_plane', label: 'Execution Plane'}, {key: 'extended.fleet', label: 'Fleet'}, {key: 'extended.instance', label: 'Instance'}, {key: 'extended.ip', label: 'IP'}, {key: 'extended.port', label: 'Port'}, {key: 'extended.az', label: 'AZ'}, {key: 'release.version', label: 'Release'}, {key: 'command', label: 'Command', format: trunc}, {key: 'extended.route', label: 'Route'}, {key: 'size', label: 'Size'},
    ],
  })
}

async function printAccountQuota(heroku: APIClient, app: Heroku.App, account: Heroku.Account) {
  if (app.process_tier !== 'free' && app.process_tier !== 'eco') {
    return
  }

  if (app.owner!.id !== account.id) {
    return
  }

  const quota = await heroku.get<Heroku.Account>(`/accounts/${account.id}/actions/get-quota`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'},
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
  const remaining = (quota.account_quota === 0) ? 0 : quota.account_quota - quota.quota_used
  const percentage = (quota.account_quota === 0) ? 0 : Math.floor(remaining / quota.account_quota * 100)
  const remainingMinutes = remaining / 60
  const hours = Math.floor(remainingMinutes / 60)
  const minutes = Math.floor(remainingMinutes % 60)
  const appQuota = quota.apps.find(appQuota => {
    return appQuota.app_uuid === app.id
  })
  const appQuotaUsed = appQuota ? appQuota.quota_used / 60 : 0
  const appPercentage = appQuota ? Math.floor(appQuota.quota_used * 100 / quota.account_quota) : 0
  const appHours = Math.floor(appQuotaUsed / 60)
  const appMinutes = Math.floor(appQuotaUsed % 60)
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

function printDynos(dynos: Heroku.Dyno) {
  const dynosByCommand = reduce(dynos, function (dynosByCommand, dyno) {
    const since = time.ago(new Date(dyno.updated_at))
    const size = dyno.size || '1X'
    if (dyno.type === 'run') {
      const key = `${color.green('run')}: one-off processes`
      if (dynosByCommand[key] === undefined)
        dynosByCommand[key] = []
      const state = dyno.state === 'up' ? color.green(dyno.state) : color.yellow(dyno.state)
      dynosByCommand[key].push(`${dyno.name} (${color.cyan(size)}): ${state} ${color.dim(since)}: ${dyno.command}`)
    } else {
      const key = `${color.green(dyno.type)} (${color.cyan(size)}): ${dyno.command}`
      if (dynosByCommand[key] === undefined)
        dynosByCommand[key] = []
      const state = dyno.state === 'up' ? color.green(dyno.state) : color.yellow(dyno.state)
      const item = `${dyno.name}: ${color.green(state)} ${color.dim(since)}`
      dynosByCommand[key].push(item)
    }

    return dynosByCommand
  }, {})
  forEach(dynosByCommand, function (dynos, key) {
    ux.styledHeader(`${key} (${color.yellow(dynos.length)})`)
    dynos = dynos.sort((a, b) => getProcessNum(a) - getProcessNum(b))
    for (const dyno of dynos)
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

    static examples = [
      '$ heroku ps',
      '$ heroku ps run # specifying types',
    ]

    public async run(): Promise<void> {
      const {flags, argv: _argv} = await this.parse(Index)
      const argv = _argv as string[]
      const app = flags.app
      const types = argv || []
      const {json, extended} = flags
      const suffix = extended ? '?extended=true' : ''

      interface StackedPromises {
        dynos: Heroku.Dyno,
        appInfo?: Heroku.App,
        accountInfo?: Heroku.Account
      }

      const promises: StackedPromises = {
        dynos: this.heroku.get<Heroku.Dyno>(`/apps/${app}/dynos${suffix}`),
      }
      promises.appInfo = this.heroku.get<Heroku.App>(`/apps/${app}`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.process-tier'},
      })
      promises.accountInfo = this.heroku.get<Heroku.Account>('/account')
      let dynos = await Promise.resolve(promises.dynos)
      const [appInfo, accountInfo] = await Promise.resolve([
        promises.appInfo, promises.accountInfo,
      ])
      const shielded = appInfo.space && appInfo.space.shield
      if (shielded) {
        dynos.forEach((d: Record<string, string>) => {
          d.size = d.size.replace('Private-', 'Shield-')
        })
      }

      if (types.length > 0) {
        dynos = dynos.filter((dyno: Record<string, string>) => types.find((t: string) => dyno.type === t))
        types.forEach((t: string) => {
          if (!dynos.find((d: Record<string, string>) => d.type === t)) {
            throw new Error(`No ${color.cyan(t)} dynos on ${color.magenta(app)}`)
          }
        })
      }

      const compare = function (a: string, b: string) {
        let comparison = 0
        if (a > b) {
          comparison = 1
        } else if (b > a) {
          comparison = -1
        }

        return comparison
      }

      dynos = dynos.sort((a: Record<string, string>, b: Record<string, string>) => compare(a.name, b.name))
      if (json)
        ux.styledJSON(dynos)
      else if (extended)
        printExtended(dynos)
      else {
        await printAccountQuota(this.heroku, appInfo, accountInfo)
        if (dynos.length === 0)
          ux.log(`No dynos on ${color.magenta(app)}`)
        else
          printDynos(dynos)
      }
    }
}
