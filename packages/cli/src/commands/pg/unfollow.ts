import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {getAddon} from '../../lib/pg/fetcher'
import pgHost from '../../lib/pg/host'
import {databaseNameFromUrl} from '../../lib/pg/util'
import confirmCommand from '../../lib/confirmCommand'
import {PgDatabase} from '../../lib/pg/types'
import heredoc from 'tsheredoc'
import {nls} from '../../nls'

export default class Unfollow extends Command {
  static topic = 'pg';
  static description = 'stop a replica from following and make it a writeable database';
  static flags = {
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({required: true, description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Unfollow)
    const {app, confirm} = flags
    const db = await getAddon(this.heroku, app, args.database)
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {hostname: pgHost()})
    if (!replica.following)
      ux.error(`${color.addon(db.name)} is not a follower`)
    const {body: configVars} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
    const origin = databaseNameFromUrl(replica.following as string, configVars)
    await confirmCommand(app, confirm, heredoc(`
      Destructive action
      ${color.addon(db.name)} will become writeable and no longer follow ${origin}. This cannot be undone.
    `))
    ux.action.start(`${color.addon(db.name)} unfollowing`)
    await this.heroku.put(`/client/v11/databases/${db.id}/unfollow`, {hostname: pgHost()})
    ux.action.stop()
  }
}
