import {APIClient, Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions, privateToShield} from '@heroku/sdk/extensions/platform'
import type {Account} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'
import tsheredoc from 'tsheredoc'

import {ago} from '../../lib/time.js'
import type {AccountQuota} from '../../lib/types/account-quota.js'
import type {DynoExtended} from '../../lib/types/dyno-extended.js'
import {huxTableNoWrapOptions} from '../../lib/utils/table-utils.js'

const heredoc = tsheredoc.default

export default class Index extends Command {
  static description = 'list dynos for an app'
  static examples = [heredoc`
    ${color.command('heroku ps')}
    === run: one-off dyno
    run.1: up for 5m: bash
    === web: bundle exec thin start -p $PORT
    web.1: created for 30s
  `, heredoc`
    ${color.command('heroku ps run')} # specifying types
    === run: one-off dyno
    run.1: up for 5m: bash
  `]
  static flags = {
    app: flags.app({required: true}),
    extended: flags.boolean({char: 'x', hidden: true}), // only works with sudo privileges
    json: flags.boolean({description: 'display as json'}),
    'no-wrap': flags.noWrap(),
    remote: flags.remote(),
  }
  static strict = false
  static topic = 'ps'
  static usage = 'ps [TYPE [TYPE ...]]'

  public async run(): Promise<void> {
    const {flags, ...restParse} = await this.parse(Index)
    const {app, extended, json} = flags
    const types = restParse.argv as string[]

    const {platform} = new HerokuSDK({extensions: [appExtensions]})

    let dynos: DynoExtended[]
    let shielded: boolean
    let processTier: string | undefined
    let appId: string | undefined
    let ownerId: string | undefined
    let accountInfo: Account

    if (extended) {
      const [{body: extDynos}, shieldedResult, appInfo, accountInfoResult] = await Promise.all([
        this.heroku.request<DynoExtended[]>(`/apps/${app}/dynos?extended=true`, {
          headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
        }),
        platform.app.isShielded(app),
        platform.app.info(app),
        platform.account.info(),
      ])
      dynos = extDynos
      shielded = shieldedResult
      processTier = (appInfo as {process_tier?: string}).process_tier
      appId = appInfo.id
      ownerId = appInfo.owner?.id
      accountInfo = accountInfoResult
    } else {
      const [dynoList, shieldedResult, appInfo, accountInfoResult] = await Promise.all([
        platform.dyno.list(app) as Promise<DynoExtended[]>,
        platform.app.isShielded(app),
        platform.app.info(app),
        platform.account.info(),
      ])
      dynos = dynoList
      shielded = shieldedResult
      processTier = (appInfo as {process_tier?: string}).process_tier
      appId = appInfo.id
      ownerId = appInfo.owner?.id
      accountInfo = accountInfoResult
    }

    if (shielded) {
      for (const d of dynos) {
        d.size = privateToShield(d.size)
      }
    }

    let selectedDynos = dynos

    if (types.length > 0) {
      selectedDynos = selectedDynos.filter(dyno => types.find((t: string) => dyno.type === t))
      for (const t of types) {
        if (!selectedDynos.some(d => d.type === t)) {
          throw new Error(`No ${color.info(t)} dynos on ${color.app(app)}`)
        }
      }
    }

    selectedDynos = selectedDynos.sort(byProcessName)

    if (json)
      hux.styledJSON(selectedDynos)
    else if (extended)
      printExtended(selectedDynos, flags['no-wrap'])
    else {
      await printAccountQuota(this.heroku, processTier, appId, ownerId, accountInfo)
      if (selectedDynos.length === 0)
        ux.stdout(`No dynos on ${color.app(app)}`)
      else
        printDynos(selectedDynos)
    }
  }
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

function byProcessNumber(a: DynoExtended, b: DynoExtended) : number {
  return getProcessNumber(a.name) - getProcessNumber(b.name)
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

function decorateCommandDyno(dyno: DynoExtended) : string {
  const since = ago(new Date(dyno.updated_at))
  const state = dyno.state === 'up' ? color.success(dyno.state) : color.warning(dyno.state)

  return `${dyno.name}: ${state} ${color.gray(since)}`
}

function decorateOneOffDyno(dyno: DynoExtended) : string {
  const since = ago(new Date(dyno.updated_at))
  // eslint-disable-next-line unicorn/explicit-length-check
  const size = dyno.size || '1X'
  const state = dyno.state === 'up' ? color.success(dyno.state) : color.warning(dyno.state)

  return `${dyno.name} (${color.info(size)}): ${state} ${color.gray(since)}: ${dyno.command}`
}

function getProcessNumber(s: string) : number {
  const [processType, dynoNumber] = (s.match(/^([^.]+)\.(.*)$/) || []).slice(1, 3)

  if (!processType || !dynoNumber?.match(/^\d+$/))
    return 0

  return Number.parseInt(dynoNumber, 10)
}

async function printAccountQuota(heroku: APIClient, processTier: string | undefined, appId: string | undefined, ownerId: string | undefined, account: Account) {
  if (processTier !== 'eco') {
    return
  }

  if (ownerId !== account.id) {
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
  const appQuota = quota.apps.find(appQuota => appQuota.app_uuid === appId)
  const appQuotaUsed = appQuota ? appQuota.quota_used / 60 : 0
  const appPercentage = appQuota ? Math.floor(appQuota.quota_used * 100 / quota.account_quota) : 0
  const appHours = Math.floor(appQuotaUsed / 60)
  const appMinutes = Math.floor(appQuotaUsed % 60)

  ux.stdout(`Eco dyno hours quota remaining this month: ${hours}h ${minutes}m (${percentage}%)`)
  ux.stdout(`Eco dyno usage for this app: ${appHours}h ${appMinutes}m (${appPercentage}%)`)
  ux.stdout('For more information on Eco dyno hours, see:')
  ux.stdout(color.info('https://devcenter.heroku.com/articles/eco-dyno-hours'))
  ux.stdout()
}

function printDynos(dynos: DynoExtended[]) : void {
  const oneOffs = dynos.filter(d => d.type === 'run').sort(byProcessNumber)

  const commands = dynos.filter(d => d.type !== 'run')
    .map(d => d.command as string)
    .filter(uniqueValues)

  // Print one-off dynos
  if (oneOffs.length > 0) {
    hux.styledHeader(`${color.label('run')}: one-off processes (${oneOffs.length})`)
    for (const dyno of oneOffs) ux.stdout(decorateOneOffDyno(dyno))
    ux.stdout()
  }

  // Print dynos grouped by command
  for (const command of commands) {
    const commandDynos = dynos.filter(d => d.command === command).sort(byProcessNumber)
    const {size = '1X', type} = commandDynos[0]

    hux.styledHeader(`${color.label(type)} (${color.info(size)}): ${command} (${commandDynos.length})`)
    for (const dyno of commandDynos)
      ux.stdout(decorateCommandDyno(dyno))
    ux.stdout()
  }
}

function printExtended(dynos: DynoExtended[], noWrap = false) {
  const sortedDynos = dynos.sort(byProcessTypeAndNumber)

  /* eslint-disable perfectionist/sort-objects */
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
    huxTableNoWrapOptions(noWrap),
  )
  /* eslint-enable perfectionist/sort-objects */
}

function truncate(s: string) {
  return s.length > 35 ? `${s.slice(0, 34)}…` : s
}

function uniqueValues(value: string, index: number, self: string[]) : boolean {
  return self.indexOf(value) === index
}
