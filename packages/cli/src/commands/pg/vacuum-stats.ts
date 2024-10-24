import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {database} from '../../lib/pg/fetcher'
import {exec} from '../../lib/pg/psql'
import heredoc from 'tsheredoc'
import {nls} from '../../nls'

export default class VacuumStats extends Command {
  static topic = 'pg';
  static description = 'show dead rows and whether an automatic vacuum is expected to be triggered';
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(VacuumStats)
    const db = await database(this.heroku, flags.app, args.database)
    const query = heredoc(`
      WITH table_opts AS (
        SELECT
          pg_class.oid, relname, nspname, array_to_string(reloptions, '') AS relopts
        FROM
          pg_class INNER JOIN pg_namespace ns ON relnamespace = ns.oid
      ), vacuum_settings AS (
        SELECT
          oid, relname, nspname,
          CASE
            WHEN relopts LIKE '%autovacuum_vacuum_threshold%'
              THEN substring(relopts, '.*autovacuum_vacuum_threshold=([0-9.]+).*')::integer
              ELSE current_setting('autovacuum_vacuum_threshold')::integer
            END AS autovacuum_vacuum_threshold,
          CASE
            WHEN relopts LIKE '%autovacuum_vacuum_scale_factor%'
              THEN substring(relopts, '.*autovacuum_vacuum_scale_factor=([0-9.]+).*')::real
              ELSE current_setting('autovacuum_vacuum_scale_factor')::real
            END AS autovacuum_vacuum_scale_factor
        FROM
          table_opts
      )
      SELECT
        vacuum_settings.nspname AS schema,
        vacuum_settings.relname AS table,
        to_char(psut.last_vacuum, 'YYYY-MM-DD HH24:MI') AS last_vacuum,
        to_char(psut.last_autovacuum, 'YYYY-MM-DD HH24:MI') AS last_autovacuum,
        to_char(pg_class.reltuples, '9G999G999G999') AS rowcount,
        to_char(psut.n_dead_tup, '9G999G999G999') AS dead_rowcount,
        to_char(autovacuum_vacuum_threshold
              + (autovacuum_vacuum_scale_factor::numeric * pg_class.reltuples), '9G999G999G999') AS autovacuum_threshold,
        CASE
          WHEN autovacuum_vacuum_threshold + (autovacuum_vacuum_scale_factor::numeric * pg_class.reltuples) < psut.n_dead_tup
          THEN 'yes'
        END AS expect_autovacuum
      FROM
        pg_stat_user_tables psut INNER JOIN pg_class ON psut.relid = pg_class.oid
          INNER JOIN vacuum_settings ON pg_class.oid = vacuum_settings.oid
      ORDER BY 1
    `)
    const output = await exec(db, query)
    ux.log(output)
  }
}
