import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {ensureEssentialTierPlan} from '../../lib/pg/extras.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export const generateFdwsqlQuery = (prefix: string): string => `
SELECT
  'CREATE FOREIGN TABLE '
  || quote_ident('${prefix}_' || c.relname)
  || '(' || array_to_string(array_agg(quote_ident(a.attname) || ' ' || t.typname), ', ') || ') '
  || ' SERVER ${prefix}_db OPTIONS'
  || ' (schema_name ''' || quote_ident(n.nspname) || ''', table_name ''' || quote_ident(c.relname) || ''');'
FROM
  pg_class     c,
  pg_attribute a,
  pg_type      t,
  pg_namespace n
WHERE
  a.attnum > 0
  AND a.attrelid = c.oid
  AND a.atttypid = t.oid
  AND n.oid = c.relnamespace
  AND c.relkind in ('r', 'v')
  AND n.nspname <> 'pg_catalog'
  AND n.nspname <> 'information_schema'
  AND n.nspname !~ '^pg_toast'
  AND pg_catalog.pg_table_is_visible(c.oid)
GROUP BY c.relname, n.nspname
ORDER BY c.relname;
`.trim()

export default class PgFdwsql extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static args = {
    prefix: Args.string({description: 'prefix for foreign data wrapper', required: true}),
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static description = 'generate fdw install sql for database'
  static examples = [heredoc`
    ${color.command('heroku pg:fdwsql example_prefix --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgFdwsql)
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(args.prefix)) {
      ux.error('prefix must start with a letter or underscore and contain only letters, numbers, and underscores', {exit: 1})
    }

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)

    await ensureEssentialTierPlan(db)

    const psqlService = new utils.pg.PsqlService(db)

    ux.stdout('CREATE EXTENSION IF NOT EXISTS postgres_fdw;')
    ux.stdout(`DROP SERVER IF EXISTS ${args.prefix}_db;`)
    ux.stdout(`CREATE SERVER ${args.prefix}_db
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (dbname '${db.database}', host '${db.host}');`)
    ux.stdout(`CREATE USER MAPPING FOR CURRENT_USER
  SERVER ${args.prefix}_db
  OPTIONS (user '${db.user}', password '${db.password}');`)

    let output = await psqlService.execQuery(generateFdwsqlQuery(args.prefix))
    output = output.split('\n').filter((l: string) => /CREATE/.test(l)).join('\n')
    ux.stdout(output)
  }
}
