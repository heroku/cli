import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export const generateTableIndexesSizeQuery = (): string => `
SELECT c.relname AS table,
  pg_size_pretty(pg_indexes_size(c.oid)) AS index_size
FROM pg_class c
LEFT JOIN pg_namespace n ON (n.oid = c.relnamespace)
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
AND n.nspname !~ '^pg_toast'
AND c.relkind='r'
ORDER BY pg_indexes_size(c.oid) DESC;
`.trim()

export default class PgTableIndexesSize extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'show the total size of all the indexes on each table, descending by size'
  static examples = [heredoc`
    ${color.command('heroku pg:table-indexes-size --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['pg:table_indexes_size']
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgTableIndexesSize)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)
    const output = await psqlService.execQuery(generateTableIndexesSizeQuery())
    ux.stdout(output)
  }
}
