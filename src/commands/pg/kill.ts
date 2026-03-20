import {Command, flags} from '@heroku-cli/command'
import * as pg from '@heroku/heroku-cli-util/utils/pg'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export default class Kill extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    pid: Args.string({description: 'ID of the process', required: true}),
  }

  static description = 'kill a query'
  static flags = {
    app: flags.app({required: true}),
    force: flags.boolean({char: 'f'}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Kill)
    const {app, force} = flags
    const {database, pid} = args

    const dbResolver = new pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(app, database)
    const psqlService = new pg.PsqlService(db)
    const query = heredoc`
      SELECT ${force ? 'pg_terminate_backend' : 'pg_cancel_backend'}(${Number.parseInt(pid, 10)});
    `
    const output = await psqlService.execQuery(query)
    ux.stdout(output)
  }
}
