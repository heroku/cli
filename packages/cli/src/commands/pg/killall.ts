import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {getAddon} from '../../lib/pg/fetcher'
import pghost from '../../lib/pg/host'
import {nls} from '../../nls'

export default class Killall extends Command {
  static topic = 'pg'
  static description = 'terminates all connections for all credentials'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Killall)
    const {app} = flags

    ux.action.start('Terminating connections for all credentials')
    const database = await getAddon(this.heroku, app, args.database)
    await this.heroku.post(`/client/v11/databases/${database.id}/connection_reset`, {hostname: pghost()})
    ux.action.stop()
  }
}
