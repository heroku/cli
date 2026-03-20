import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import * as pg from '@heroku/heroku-cli-util/utils/pg'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirmCommand.js'
import {PgDatabase} from '../../lib/pg/types.js'
import {databaseNameFromUrl} from '../../lib/pg/util.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export default class Unfollow extends Command {
  static args = {
    database: Args.string({description: nls('pg:database:arg:description'), required: true}),
  }

  static description = 'stop a replica from following and make it a writeable database'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Unfollow)
    const {app, confirm} = flags
    const dbResolver = new pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, args.database)
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pg.getHost()})
    if (!replica.following)
      ux.error(`${color.addon(db.name)} is not a follower`)
    const {body: configVars} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
    const origin = databaseNameFromUrl(replica.following as string, configVars)
    await new ConfirmCommand().confirm(app, confirm, heredoc(`
      Destructive action
      ${color.addon(db.name)} will become writeable and no longer follow ${origin}. This cannot be undone.
    `))
    ux.action.start(`${color.addon(db.name)} unfollowing`)
    await this.heroku.put(`/client/v11/databases/${db.id}/unfollow`, {hostname: pg.getHost()})
    ux.action.stop()
  }
}
