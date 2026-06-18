import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export const generateSeqScansQuery = (): string => `
SELECT relname AS name,
       seq_scan as count
FROM
  pg_stat_user_tables
ORDER BY seq_scan DESC;
`.trim()

export default class PgSeqScans extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'show the count of sequential scans by table descending by order'
  static examples = [heredoc`
    ${color.command('heroku pg:seq-scans --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['pg:seq_scans']
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgSeqScans)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)
    const output = await psqlService.execQuery(generateSeqScansQuery())
    ux.stdout(output)
  }
}
