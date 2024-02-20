import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {ago} from '../../lib/time'
import {APIClient} from '@heroku-cli/command'
import {AccountQuota} from '../../lib/types/account_quota'
import {DynoExtended} from '../../lib/types/dyno_extended'
import heredoc from 'tsheredoc'

function getProcessNumber(s: string) : number {
  return Number.parseInt(s.split('.', 2)[1], 10)
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

  ux.table(
    sortedDynos,
    {
      ID: {get: (dyno: DynoExtended) => dyno.id},
      Process: {get: (dyno: DynoExtended) => dyno.name},
      State: {get: (dyno: DynoExtended) => `${dyno.state} ${ago(new Date(dyno.updated_at))}`},
      Region: {get: (dyno: DynoExtended) => dyno.extended ? dyno.extended.region : ''},
      'Execution Plane': {get: (dyno: DynoExtended) => dyno.extended ? dyno.extended.execution_plane : ''},
      Fleet: {get: (dyno: DynoExtended) => dyno.extended ? dyno.extended.fleet : ''},
      Instance: {get: (dyno: DynoExtended) => dyno.extended ? dyno.extended.instance : ''},
      IP: {get: (dyno: DynoExtended) => dyno.extended ? dyno.extended.ip : ''},
      Port: {get: (dyno: DynoExtended) => dyno.extended ? dyno.extended.port.toString() : ''},
      AZ: {get: (dyno: DynoExtended) => dyno.extended ? dyno.extended.az : ''},
      Release: {get: (dyno: DynoExtended) => dyno.release.version},
      Command: {get: (dyno: DynoExtended) => truncate(dyno.command)},
      Route: {get: (dyno: DynoExtended) => dyno.extended ? dyno.extended.route : ''},
      Size: {get: (dyno: DynoExtended) => dyno.size},
    },
    {
      'no-truncate': true,
    },
  )
}

async function printAccountQuota(heroku: APIClient, app: Required<Heroku.App>, account: Required<Heroku.Account>) {
  if (app.process_tier !== 'free' && app.process_tier !== 'eco') {
    return
  }

  if (app.owner.id !== account.id) {
    return
  }

  const {body: quota} = await heroku.request<AccountQuota>(
    `/accounts/${account.id}/actions/get-quota`,
    {headers: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'}},
  ).catch(() => {
    return {body: null}
  })

  if (!quota || (quota.id && quota.id === 'not_found')) {
    return
  }

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

  return `${dyno.name}: ${color.green(state)} ${color.dim(since)}`
}

function printDynos(dynos: DynoExtended[]) : void {
  const oneOffs = dynos.filter(d => d.type === 'run').sort(byProcessNumber)
  const commands = dynos.filter(d => d.type !== 'run').map(d => d.command).filter(uniqueValues)

  // Print one-off dynos
  if (oneOffs.length > 0) {
    ux.styledHeader(`${color.green('run')}: one-off processes (${color.yellow(oneOffs.length.toString())})`)
    oneOffs.forEach(dyno => ux.log(decorateOneOffDyno(dyno)))
    ux.log()
  }

  // Print dynos grouped by command
  commands.forEach(function (command) {
    const commandDynos = dynos.filter(d => d.command === command).sort(byProcessNumber)
    const type = commandDynos[0].type
    // eslint-disable-next-line unicorn/explicit-length-check
    const size = commandDynos[0].size || '1X'

    ux.styledHeader(`${color.green(type)} (${color.cyan(size)}): ${command} (${color.yellow(commandDynos.length.toString())})`)
    for (const dyno of commandDynos)
      ux.log(decorateCommandDyno(dyno))
    ux.log()
  })
}

export default class Index extends Command {
  static topic = 'ps'
  static description = 'list dynos for an app'
  static strict = false
  static usage = 'ps [TYPE [TYPE ...]]'

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
    json: flags.boolean({description: 'display as json'}),
    extended: flags.boolean({char: 'x', hidden: true}), // should be removed? Platform API doesn't serialize extended attributes even if the query param `extended=true` is sent.
  }

  public async run(): Promise<void> {
    const {flags, ...restParse} = await this.parse(Index)
    const {app, json, extended} = flags
    const types = restParse.argv as string[]
    const suffix = extended ? '?extended=true' : '' // read previous comment, including this on the request doesn't make any difference.
    const promises = {
      dynos: this.heroku.request<DynoExtended[]>(`/apps/${app}/dynos${suffix}`),
      appInfo: this.heroku.request<Required<Heroku.App>>(`/apps/${app}`, {headers: {Accept: 'application/vnd.heroku+json; version=3.process-tier'}}),
      accountInfo: this.heroku.request<Required<Heroku.Account>>('/account'),
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
          throw new Error(`No ${color.cyan(t)} dynos on ${color.magenta(app)}`)
        }
      })
    }

    selectedDynos = selectedDynos.sort(byProcessName)

    if (json)
      ux.styledJSON(selectedDynos)
    else if (extended)
      printExtended(selectedDynos)
    else {
      await printAccountQuota(this.heroku, appInfo, accountInfo)
      if (selectedDynos.length === 0)
        ux.log(`No dynos on ${color.magenta(app)}`)
      else
        printDynos(selectedDynos)
    }
  }
}
