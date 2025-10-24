/*
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {utils} from '@heroku/heroku-cli-util'
import {nls} from '../../nls'

export default class Blocking extends Command {
    static topic = 'pg'
    static description = 'display queries holding locks other queries are waiting to be released'
    static flags = {
      app: flags.app({required: true}),
      remote: flags.remote(),
    }

    static args = {
      database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    }

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Blocking)
      const {app} = flags
      const query = heredoc`
        SELECT bl.pid AS blocked_pid,
          ka.query AS blocking_statement,
          now() - ka.query_start AS blocking_duration,
          kl.pid AS blocking_pid,
          a.query AS blocked_statement,
          now() - a.query_start AS blocked_duration
        FROM pg_catalog.pg_locks bl
        JOIN pg_catalog.pg_stat_activity a
          ON bl.pid = a.pid
        JOIN pg_catalog.pg_locks kl
          JOIN pg_catalog.pg_stat_activity ka
            ON kl.pid = ka.pid
        ON bl.transactionid = kl.transactionid AND bl.pid != kl.pid
        WHERE NOT bl.granted
      `

      const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
      const db = await dbResolver.getDatabase(app, args.database)
      const psqlService = new utils.pg.PsqlService(db)
      const output = await psqlService.execQuery(query)

      ux.log(output)
    }
}
*/
