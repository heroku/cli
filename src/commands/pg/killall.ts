import {Command, flags} from '@heroku-cli/command'
import {utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import {nls} from '../../nls.js'

export default class Killall extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'terminates all connections for all credentials'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Killall)
    const {app} = flags

    ux.action.start('Terminating connections for all credentials')
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon} = await dbResolver.getAttachment(app, args.database)
    await this.heroku.post(`/client/v11/databases/${addon.id}/connection_reset`, {hostname: utils.pg.host()})
    ux.action.stop()
  }
}
