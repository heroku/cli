import {color, hux} from '@heroku/heroku-cli-util'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {ago} from '../../lib/time.js'
import {AccountQuota} from '../../lib/types/account_quota.js'
import {AppProcessTier} from '../../lib/types/app_process_tier.js'
import {DynoExtended} from '../../lib/types/dyno_extended.js'
import {Account} from '../../lib/types/fir.js'

const heredoc = tsheredoc.default

function getProcessNumber(s: string) : number {
  const [processType, dynoNumber] = (s.match(/^([^.]+)\.(.*)$/) || []).slice(1, 3)

  if (!processType || !dynoNumber?.match(/^\d+$/))
    return 0

  return Number.parseInt(dynoNumber, 10)
}

function uniqueValues(value: string, index: number, self: string[]) : boolean {
  return self.indexOf(value) === index
}

function byProcessNumber(a: DynoExtended, b: DynoExtended) : number {
  return getProcessNumber(a.name) - getProcessNumber(b.name)
}

function byProcessName(a: DynoExtended, b: DynoExtended) : number {
  if (a.name > b.name) {
    return 1
  }

  if (b.name > a.name) {
    return -1
  }

  return 0
}

function byProcessTypeAndNumber(a: DynoExtended, b: DynoExtended) : number {
  if (a.type > b.type) {
    return 1
  }

  if (b.type > a.type) {
    return -1
  }

  return getProcessNumber(a.name) - getProcessNumber(b.name)
}

function truncate(s: string) {
  return s.length > 35 ? `${s.slice(0, 34)}…` : s
}

function printExtended(dynos: DynoExtended[]) {
  const sortedDynos = dynos.sort(byProcessTypeAndNumber)

  hux.table<DynoExtended>(
    sortedDynos,
    {
      ID: {get: (dyno: DynoExtended) => dyno.id},
      Process: {get: (dyno: DynoExtended) => dyno.name},
      State: {get: (dyno: DynoExtended) => `${dyno.state} ${ago(new Date(dyno.updated_at))}`},
      Region: {get: (dyno: DynoExtended) => dyno.extended?.region ?? ''},
      'Execution Plane': {get: (dyno: DynoExtended) => dyno.extended?.execution_plane ?? ''},
      Fleet: {get: (dyno: DynoExtended) => dyno.extended?.fleet ?? ''},
      Instance: {get: (dyno: DynoExtended) => dyno.extended?.instance ?? ''},
      IP: {get: (dyno: DynoExtended) => dyno.extended?.ip ?? ''},
      Port: {get: (dyno: DynoExtended) => dyno.extended?.port?.toString() ?? ''},
      AZ: {get: (dyno: DynoExtended) => dyno.extended?.az ?? ''},
      Release: {get: (dyno: DynoExtended) => dyno.release.version},
      Command: {get: (dyno: DynoExtended) => truncate(dyno.command)},
      Route: {get: (dyno: DynoExtended) => dyno.extended?.route ?? ''},
      Size: {get: (dyno: DynoExtended) => dyno.size},
    },
    {
      overflow: 'wrap',
    },
  )
}

async function printAccountQuota(heroku: APIClient, app: AppProcessTier, account: Account) {
  if (app.process_tier !== 'free' && app.process_tier !== 'eco') {
    return
  }

  if (app.owner.id !== account.id) {
    return
  }

  const {body: quota} = await heroku.request<AccountQuota>(
    `/accounts/${account.id}/actions/get-quota`,
    {headers: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'}},
  ).catch(() => (
    {body: null}
  ))

  if (!quota || (quota.id && quota.id === 'not_found')) {
    return
  }

  const remaining = (quota.account_quota === 0) ? 0 : quota.account_quota - quota.quota_used
  const percentage = (quota.account_quota === 0) ? 0 : Math.floor(remaining / quota.account_quota * 100)
  const remainingMinutes = remaining / 60
  const hours = Math.floor(remainingMinutes / 60)
  const minutes = Math.floor(remainingMinutes % 60)
  const appQuota = quota.apps.find(appQuota => appQuota.app_uuid === app.id)
  const appQuotaUsed = appQuota ? appQuota.quota_used / 60 : 0
  const appPercentage = appQuota ? Math.floor(appQuota.quota_used * 100 / quota.account_quota) : 0
  const appHours = Math.floor(appQuotaUsed / 60)
  const appMinutes = Math.floor(appQuotaUsed % 60)

  if (app.process_tier === 'eco') {
    ux.stdout(`Eco dyno hours quota remaining this month: ${hours}h ${minutes}m (${percentage}%)`)
    ux.stdout(`Eco dyno usage for this app: ${appHours}h ${appMinutes}m (${appPercentage}%)`)
    ux.stdout('For more information on Eco dyno hours, see:')
    ux.stdout('https://devcenter.heroku.com/articles/eco-dyno-hours')
    ux.stdout()
  }

  if (app.process_tier === 'free') {
    ux.stdout(`Free dyno hours quota remaining this month: ${hours}h ${minutes}m (${percentage}%)`)
    ux.stdout(`Free dyno usage for this app: ${appHours}h ${appMinutes}m (${appPercentage}%)`)
    ux.stdout('For more information on dyno sleeping and how to upgrade, see:')
    ux.stdout('https://devcenter.heroku.com/articles/dyno-sleeping')
    ux.stdout()
  }
}

function decorateOneOffDyno(dyno: DynoExtended) : string {
  const since = ago(new Date(dyno.updated_at))
  // eslint-disable-next-line unicorn/explicit-length-check
  const size = dyno.size || '1X'
  const state = dyno.state === 'up' ? color.green(dyno.state) : color.yellow(dyno.state)

  return `${dyno.name} (${color.cyan(size)}): ${state} ${color.dim(since)}: ${dyno.command}`
}

function decorateCommandDyno(dyno: DynoExtended) : string {
  const since = ago(new Date(dyno.updated_at))
  const state = dyno.state === 'up' ? color.green(dyno.state) : color.yellow(dyno.state)

  return `${dyno.name}: ${state} ${color.dim(since)}`
}

function printDynos(dynos: DynoExtended[]) : void {
  const oneOffs = dynos.filter(d => d.type === 'run').sort(byProcessNumber)

  const commands = dynos.filter(d => d.type !== 'run')
    .map(d => d.command as string)
    .filter(uniqueValues)

  // Print one-off dynos
  if (oneOffs.length > 0) {
    hux.styledHeader(`${color.green('run')}: one-off processes (${color.yellow(oneOffs.length.toString())})`)
    oneOffs.forEach(dyno => ux.stdout(decorateOneOffDyno(dyno)))
    ux.stdout()
  }

  // Print dynos grouped by command
  commands.forEach(command => {
    const commandDynos = dynos.filter(d => d.command === command).sort(byProcessNumber)
    const {size = '1X', type} = commandDynos[0]

    hux.styledHeader(`${color.green(type)} (${color.cyan(size)}): ${command} (${color.yellow(commandDynos.length.toString())})`)
    for (const dyno of commandDynos)
      ux.stdout(decorateCommandDyno(dyno))
    ux.stdout()
  })
}

export default class Index extends Command {
  static description = 'list dynos for an app'
  static examples = [heredoc`
    $ heroku ps
    === run: one-off dyno
    run.1: up for 5m: bash
    === web: bundle exec thin start -p $PORT
    web.1: created for 30s
  `, heredoc`
    $ heroku ps run # specifying types
    === run: one-off dyno
    run.1: up for 5m: bash
  `]

  static flags = {
    app: flags.app({required: true}),
    extended: flags.boolean({char: 'x', hidden: true}), // only works with sudo privileges
    json: flags.boolean({description: 'display as json'}),
    remote: flags.remote(),
  }

  static strict = false

  static topic = 'ps'

  static usage = 'ps [TYPE [TYPE ...]]'

  public async run(): Promise<void> {
    const {flags, ...restParse} = await this.parse(Index)
    const {app, extended, json} = flags
    const types = restParse.argv as string[]
    const suffix = extended ? '?extended=true' : ''
    const promises = {
      accountInfo: this.heroku.request<Account>('/account', {
        headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
      }),
      appInfo: this.heroku.request<AppProcessTier>(`/apps/${app}`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
      }),
      dynos: this.heroku.request<DynoExtended[]>(`/apps/${app}/dynos${suffix}`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
      }),
    }
    const [{body: dynos}, {body: appInfo}, {body: accountInfo}] = await Promise.all([promises.dynos, promises.appInfo, promises.accountInfo])
    const shielded = appInfo.space && appInfo.space.shield

    if (shielded) {
      dynos.forEach(d => {
        d.size = d.size.replace('Private-', 'Shield-')
      })
    }

    let selectedDynos = dynos

    if (types.length > 0) {
      selectedDynos = selectedDynos.filter(dyno => types.find((t: string) => dyno.type === t))
      types.forEach(t => {
        if (!selectedDynos.some(d => d.type === t)) {
          throw new Error(`No ${color.cyan(t)} dynos on ${color.app(app)}`)
        }
      })
    }

    selectedDynos = selectedDynos.sort(byProcessName)

    if (json)
      hux.styledJSON(selectedDynos)
    else if (extended)
      printExtended(selectedDynos)
    else {
      await printAccountQuota(this.heroku, appInfo, accountInfo)
      if (selectedDynos.length === 0)
        ux.stdout(`No dynos on ${color.app(app)}`)
      else
        printDynos(selectedDynos)
    }
  }
}
