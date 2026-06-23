import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export const generateTotalTableSizeQuery = (): string => `
SELECT c.relname AS name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM pg_class c
LEFT JOIN pg_namespace n ON (n.oid = c.relnamespace)
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
AND n.nspname !~ '^pg_toast'
AND c.relkind='r'
ORDER BY pg_total_relation_size(c.oid) DESC;
`.trim()

export default class PgTotalTableSize extends Command {
  static aliases = ['pg:total_table_size']
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'show the size of the tables (including indexes), descending by size'
  static examples = [heredoc`
    ${color.command('heroku pg:total-table-size --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgTotalTableSize)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)
    const output = await psqlService.execQuery(generateTotalTableSizeQuery())
    ux.stdout(output)
  }
}
