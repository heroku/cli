import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export const generateRecordsRankQuery = (): string => `
SELECT
  relname AS name,
  n_live_tup AS estimated_count
FROM
  pg_stat_user_tables
ORDER BY
  n_live_tup DESC;
`.trim()

export default class PgRecordsRank extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'show all tables and the number of rows in each ordered by number of rows descending'
  static examples = [heredoc`
    ${color.command('heroku pg:records-rank --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['pg:records_rank']
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgRecordsRank)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)
    const output = await psqlService.execQuery(generateRecordsRankQuery())
    ux.stdout(output)
  }
}
