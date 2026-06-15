import {Command, flags} from '@heroku-cli/command'
import {utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

export const generateIndexUsageQuery = (): string => `
SELECT relname,
   CASE idx_scan
     WHEN 0 THEN 'Insufficient data'
     ELSE (100 * idx_scan / (seq_scan + idx_scan))::text
   END percent_of_times_index_used,
   n_live_tup rows_in_table
 FROM
   pg_stat_user_tables
 ORDER BY
   n_live_tup DESC;
`.trim()

export default class PgIndexUsage extends Command {
  static args = {
    database: Args.string({description: 'database name', required: false}),
  }
  static description = 'calculates your index hit rate (effective databases are at 99% and up)'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['pg:index_usage']
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgIndexUsage)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)
    const output = await psqlService.execQuery(generateIndexUsageQuery())
    ux.stdout(output)
  }
}
