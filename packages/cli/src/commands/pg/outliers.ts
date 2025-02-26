import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {database} from '../../lib/pg/fetcher'
import {exec, fetchVersion} from '../../lib/pg/psql'
import {getConnectionDetails} from '../../lib/pg/util'
import heredoc from 'tsheredoc'
import {nls} from '../../nls'

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
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
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

    let totalExecTimeField = ''
    if (version && Number.parseInt(version, 10) >= 13) {
      totalExecTimeField = 'total_exec_time'
    } else {
      totalExecTimeField = 'total_time'
    }

    let blkReadTimeField = ''
    let blkWriteTimeField = ''
    if (version && Number.parseInt(version, 10) >= 17) {
      blkReadTimeField = 'shared_blk_read_time'
      blkWriteTimeField = 'shared_blk_write_time'
    } else {
      blkReadTimeField = 'blk_read_time'
      blkWriteTimeField = 'blk_write_time'
    }

    return heredoc`
        SELECT
          interval '1 millisecond' * ${totalExecTimeField} AS total_exec_time,
          to_char((${totalExecTimeField}/sum(${totalExecTimeField}) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
          to_char(calls, 'FM999G999G999G990') AS ncalls,
          interval '1 millisecond' * (${blkReadTimeField} + ${blkWriteTimeField}) AS sync_io_time,
          ${truncatedQueryString} AS query
        FROM pg_stat_statements
        WHERE userid = (
          SELECT usesysid FROM pg_user WHERE usename = current_user LIMIT 1
        )
        ORDER BY ${totalExecTimeField} DESC
        LIMIT ${limit};
      `
  }
}
