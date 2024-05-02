import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import pgHost from '../../lib/pg/host'
import {getAddon} from '../../lib/pg/fetcher'
import {essentialPlan, databaseNameFromUrl} from '../../lib/pg/util'
import confirmCommand from '../../lib/confirmCommand'
import {PgDatabase} from '../../lib/pg/types'

export default class Repoint extends Command {
  static hidden = true;
  static topic = 'pg';
  static description = 'changes which leader a follower is following';
  static help = 'Example:\n\n    heroku pg:repoint postgresql-transparent-56874 --follow postgresql-lucid-59103 -a woodstock-production\n';
  static flags = {
    confirm: flags.string({char: 'c'}),
    follow: flags.string({description: 'leader database to follow'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string(),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Repoint)
    ux.warn('This is a beta command and is not considered reliable or complete. Use with caution.')
    const {confirm, follow, app} = flags
    const db = await getAddon(this.heroku, app, args.database)
    if (essentialPlan(db))
      throw new Error('pg:repoint is only available for follower databases on at least the Standard tier.')
    const {body: replica} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${db.id}`, {host: pgHost()})
    if (!replica.following) {
      throw new Error('pg:repoint is only available for follower databases on at least the Standard tier.')
    }

    const {body: configVars} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
    const origin = databaseNameFromUrl(replica.following, configVars)
    const newLeader = await getAddon(this.heroku, app, follow)
    await confirmCommand(app, confirm, `WARNING: Destructive action\n${color.yellow(db.name)} will be repointed to follow ${newLeader.name}, and stop following ${origin}.\n\nThis cannot be undone.`)
    const data = {follow: newLeader.id}

    ux.action.start(`Starting repoint of ${color.yellow(db.name)}`)
    await this.heroku.post(`/client/v11/databases/${db.id}/repoint`, {host: pgHost(), body: data})
    ux.action.stop(`${color.cyan.bold('heroku pg:wait')} to track status`)
  }
}
