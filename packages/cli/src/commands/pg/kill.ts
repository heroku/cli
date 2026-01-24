import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {utils} from '@heroku/heroku-cli-util'
import tsheredoc from 'tsheredoc'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export default class Kill extends Command {
  static topic = 'pg';
  static description = 'kill a query';
  static flags = {
    force: flags.boolean({char: 'f'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    pid: Args.string({required: true, description: 'ID of the process'}),
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Kill)
    const {app, force} = flags
    const {pid, database} = args

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
