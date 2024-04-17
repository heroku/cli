import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {database} from '../../lib/pg/fetcher'
import {exec} from '../../lib/pg/psql'

export default class Blocking extends Command {
    static topic = 'pg'
    static description = 'display queries holding locks other queries are waiting to be released'
    static flags = {
      app: flags.app({required: true}),
      remote: flags.remote(),
    }

    static args = {
      database: Args.string(),
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

      const db = await database(this.heroku, app, args.database)
      const output = await exec(db, query)

      ux.log(output)
    }
}
