import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {database} from '../../lib/pg/fetcher'
import {exec} from '../../lib/pg/psql'
import heredoc from 'tsheredoc'

export default class Locks extends Command {
  static topic = 'pg'
  static description = 'display queries with active locks'
  static flags = {
    truncate: flags.boolean({char: 't', description: 'truncates queries to 40 characters'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: 'config var exposed to the owning app containing the database configuration'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Locks)
    const {app, truncate} = flags
    const db = await database(this.heroku, app, args.database)
    const query = heredoc`
      SELECT
        pg_stat_activity.pid,
        pg_class.relname,
        pg_locks.transactionid,
        pg_locks.granted,
        ${this.truncatedQueryString(truncate)} AS query_snippet,
        age(now(), pg_stat_activity.query_start) AS "age"
      FROM
        pg_stat_activity,
        pg_locks
          LEFT OUTER JOIN pg_class
          ON pg_locks.relation = pg_class.oid
      WHERE
        pg_stat_activity.query <> '<insufficient privilege>'
        AND pg_locks.pid = pg_stat_activity.pid
        AND pg_locks.mode = 'ExclusiveLock'
        AND pg_stat_activity.pid <> pg_backend_pid() order by query_start;
    `

    const output = await exec(db, query)
    ux.log(output)
  }

  protected truncatedQueryString(truncate: boolean) {
    const column = 'pg_stat_activity.query'
    if (truncate) {
      return `CASE WHEN length(${column}) <= 40 THEN ${column} ELSE substr(${column}, 0, 39) || '…' END`
    }

    return column
  }
}
