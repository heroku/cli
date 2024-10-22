import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {database} from '../../lib/pg/fetcher'
import {exec, fetchVersion} from '../../lib/pg/psql'
import {getConnectionDetails} from '../../lib/pg/util'
import heredoc from 'tsheredoc'

export default class Outliers extends Command {
  static topic = 'pg'
  static description = 'show 10 queries that have longest execution time in aggregate'
  static flags = {
    reset: flags.boolean({description: 'resets statistics gathered by pg_stat_statements'}),
    truncate: flags.boolean({char: 't', description: 'truncate queries to 40 characters'}),
    num: flags.string({char: 'n', description: 'the number of queries to display (default: 10)'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: 'config var exposed to the owning app containing the database configuration'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Outliers)
    const {app, reset, truncate, num} = flags

    const db = await database(this.heroku, app, args.database)
    const version = await fetchVersion(db)
    await this.ensurePGStatStatement(db)

    if (reset) {
      await exec(db, 'SELECT pg_stat_statements_reset();')
      return
    }

    let limit = 10
    if (num) {
      if (/^(\d+)$/.exec(num)) {
        limit = Number.parseInt(num, 10)
      } else {
        ux.error(`Cannot parse num param value "${num}" to a number`)
      }
    }

    const query = this.outliersQuery(version, limit, truncate)
    const output = await exec(db, query)
    ux.log(output)
  }

  protected async ensurePGStatStatement(db: ReturnType<typeof getConnectionDetails>) {
    const query = heredoc`
      SELECT exists(
        SELECT 1
        FROM pg_extension e
          LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'pg_stat_statements' AND n.nspname IN ('public', 'heroku_ext')
      ) AS available;
    `
    const output = await exec(db, query)

    if (!output.includes('t')) {
      ux.error(heredoc`
        pg_stat_statements extension need to be installed first.
        You can install it by running: CREATE EXTENSION pg_stat_statements WITH SCHEMA heroku_ext;
      `)
    }
  }

  protected outliersQuery(version: string | undefined, limit: number, truncate: boolean) {
    const truncatedQueryString = truncate ? heredoc`
      CASE WHEN length(query) <= 40 THEN query ELSE substr(query, 0, 39) || '…' END
    ` : 'query'

    if (version && Number.parseInt(version, 10) >= 13) {
      return heredoc`
        SELECT
          interval '1 millisecond' * total_exec_time AS total_exec_time,
          to_char((total_exec_time/sum(total_exec_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
          to_char(calls, 'FM999G999G999G990') AS ncalls,
          interval '1 millisecond' * (blk_read_time + blk_write_time) AS sync_io_time,
          ${truncatedQueryString} AS query
        FROM pg_stat_statements
        WHERE userid = (
          SELECT usesysid FROM pg_user WHERE usename = current_user LIMIT 1
        )
        ORDER BY total_exec_time DESC
        LIMIT ${limit};
      `
    }

    return heredoc`
      SELECT
        interval '1 millisecond' * total_time AS total_exec_time,
        to_char((total_time/sum(total_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
        to_char(calls, 'FM999G999G999G990') AS ncalls,
        interval '1 millisecond' * (blk_read_time + blk_write_time) AS sync_io_time,
        ${truncatedQueryString} AS query
      FROM pg_stat_statements
      WHERE userid = (
        SELECT usesysid FROM pg_user WHERE usename = current_user LIMIT 1
      )
      ORDER BY total_time DESC
      LIMIT ${limit};
    `
  }
}
