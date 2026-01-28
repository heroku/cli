import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {utils} from '@heroku/heroku-cli-util'
import {databaseNameFromUrl} from '../../lib/pg/util.js'
import ConfirmCommand from '../../lib/confirmCommand.js'
import {PgDatabase} from '../../lib/pg/types.js'
import tsheredoc from 'tsheredoc'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export default class Unfollow extends Command {
  static topic = 'pg';
  static description = 'stop a replica from following and make it a writeable database';
  static flags = {
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({required: true, description: nls('pg:database:arg:description')}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Unfollow)
    const {app, confirm} = flags
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, args.database)
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: utils.pg.host()})
    if (!replica.following)
      ux.error(`${color.addon(db.name)} is not a follower`)
    const {body: configVars} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
    const origin = databaseNameFromUrl(replica.following as string, configVars)
    await new ConfirmCommand().confirm(app, confirm, heredoc(`
      Destructive action
      ${color.addon(db.name)} will become writeable and no longer follow ${origin}. This cannot be undone.
    `))
    ux.action.start(`${color.addon(db.name)} unfollowing`)
    await this.heroku.put(`/client/v11/databases/${db.id}/unfollow`, {hostname: utils.pg.host()})
    ux.action.stop()
  }
}
