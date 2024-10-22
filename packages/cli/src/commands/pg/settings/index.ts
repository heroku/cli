import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {SettingKey, SettingsResponse} from '../../../lib/pg/types'
import {addonResolver} from '../../../lib/addons/resolve'
import {essentialPlan} from '../../../lib/pg/util'
import host from '../../../lib/pg/host'

export default class Index extends Command {
  static topic = 'pg'
  static description = 'show your current database settings'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: 'config var exposed to the owning app containing the database configuration'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Index)
    const {app} = flags
    const {database} = args
    const db = await addonResolver(this.heroku, app, database || 'DATABASE_URL')

    if (essentialPlan(db)) ux.error('You can’t perform this operation on Essential-tier databases.')

    const {body: settings} = await this.heroku.get<SettingsResponse>(`/postgres/v0/databases/${db.id}/config`, {hostname: host()})
    ux.styledHeader(db.name)
    const remapped: Record<string, unknown> = {}
    Object.keys(settings).forEach(k => {
      remapped[k.replace(/_/g, '-')] = settings[k as SettingKey].value
    })
    ux.styledObject(remapped)
  }
}
