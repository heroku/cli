import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export const generateLongRunningQueriesQuery = (): string => `
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query AS query
FROM
  pg_stat_activity
WHERE
  pg_stat_activity.query <> ''::text
  AND state <> 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
  AND NOT (
    state = 'idle in transaction'
    AND usename = 'postgres'
    AND query LIKE '%pg_backup_start%'
  )
ORDER BY
  now() - pg_stat_activity.query_start DESC;
`.trim()

export default class PgLongRunningQueries extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'show all queries longer than five minutes by descending duration'
  static examples = [heredoc`
    ${color.command('heroku pg:long-running-queries --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['pg:long_running_queries']
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgLongRunningQueries)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)
    const output = await psqlService.execQuery(generateLongRunningQueriesQuery())
    ux.stdout(output)
  }
}
