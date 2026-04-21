import {Command, flags} from '@heroku-cli/command'
import {utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {fetchVersion} from '../../lib/pg/psql.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export default class Outliers extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'show 10 queries that have longest execution time in aggregate'
  static flags = {
    app: flags.app({required: true}),
    num: flags.string({char: 'n', description: 'the number of queries to display (default: 10)'}),
    remote: flags.remote(),
    reset: flags.boolean({description: 'resets statistics gathered by pg_stat_statements'}),
    truncate: flags.boolean({char: 't', description: 'truncate queries to 40 characters'}),
  }
  static topic = 'pg'
  private psqlService: InstanceType<typeof utils.pg.PsqlService> | undefined

  protected async ensurePGStatStatement() {
    const query = heredoc`
      SELECT exists(
        SELECT 1
        FROM pg_extension e
          LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'pg_stat_statements' AND n.nspname IN ('public', 'heroku_ext')
      ) AS available;
    `
    const output = await this.psqlService!.execQuery(query)

    if (!output.includes('t')) {
      ux.error(heredoc`
        pg_stat_statements extension need to be installed first.
        You can install it by running: CREATE EXTENSION pg_stat_statements WITH SCHEMA heroku_ext;
      `)
    }
  }

  protected outliersQuery(version: string | undefined, limit: number, truncate: boolean) {
    const truncatedQueryString = truncate
      ? heredoc`
      CASE WHEN length(query) <= 40 THEN query ELSE substr(query, 0, 39) || '…' END
    `
      : 'query'

    let totalExecTimeField = ''
    totalExecTimeField = version && Number.parseInt(version, 10) >= 13 ? 'total_exec_time' : 'total_time'

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

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Outliers)
    const {app, num, reset, truncate} = flags

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(app, args.database)
    this.psqlService = new utils.pg.PsqlService(db)
    const version = await fetchVersion(db)
    await this.ensurePGStatStatement()

    if (reset) {
      await this.psqlService.execQuery('SELECT pg_stat_statements_reset();')
      return
    }

    let limit = 10
    if (num) {
      if (/^(\d+)$/.test(num)) {
        limit = Number.parseInt(num, 10)
      } else {
        ux.error(`Cannot parse num param value "${num}" to a number`)
      }
    }

    const query = this.outliersQuery(version, limit, truncate)
    const output = await this.psqlService.execQuery(query)
    ux.stdout(output)
  }
}
