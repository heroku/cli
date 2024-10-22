import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {database} from '../../lib/pg/fetcher'
import {exec} from '../../lib/pg/psql'
import heredoc from 'tsheredoc'

export default class Kill extends Command {
  static topic = 'pg';
  static description = 'kill a query';
  static flags = {
    force: flags.boolean({char: 'f'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    pid: Args.string({required: true, description: 'process ID to kill'}),
    database: Args.string({description: 'globally unique name or ID of the database add-on attachment'}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Kill)
    const {app, force} = flags
    const {pid} = args

    const db = await database(this.heroku, app, args.database)
    const query = heredoc`
      SELECT ${force ? 'pg_terminate_backend' : 'pg_cancel_backend'}(${Number.parseInt(pid, 10)});
    `
    const output = await exec(db, query)
    ux.log(output)
  }
}
