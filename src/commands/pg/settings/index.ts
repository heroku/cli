import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import * as pg from '@heroku/heroku-cli-util/utils/pg'
import {Args, ux} from '@oclif/core'

import type {SettingKey, SettingsResponse} from '../../../lib/pg/types.js'

import {essentialPlan} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

export default class Index extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static description = 'show your current database settings'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Index)
    const {app} = flags
    const {database} = args
    const dbResolver = new pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)

    if (essentialPlan(db)) {
      ux.error('You can\'t perform this operation on Essential-tier databases.')
    }

    const {body: settings} = await this.heroku.get<SettingsResponse>(`/postgres/v0/databases/${db.id}/config`, {hostname: pg.getHost()})
    hux.styledHeader(db.name)
    const remapped: Record<string, unknown> = {}
    Object.keys(settings).sort().forEach(k => {
      remapped[k.replaceAll('_', '-')] = settings[k as SettingKey].value
    })
    hux.styledObject(remapped)
  }
}
