import {Command, flags} from '@heroku-cli/command'
import {utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export default class Kill extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static args = {
    pid: Args.string({description: 'ID of the process', required: true}),
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  /* eslint-enable perfectionist/sort-objects */
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

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(app, database)
    const psqlService = new utils.pg.PsqlService(db)
    const query = heredoc`
      SELECT ${force ? 'pg_terminate_backend' : 'pg_cancel_backend'}(${Number.parseInt(pid, 10)});
    `
    const output = await psqlService.execQuery(query)
    ux.stdout(output)
  }
}
