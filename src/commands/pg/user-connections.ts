import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export const generateUserConnectionsQuery = (): string => `
SELECT
  usename AS credential,
  count(*) AS connections
FROM pg_stat_activity
WHERE state = 'active'
GROUP BY usename
ORDER BY connections DESC;
`.trim()

export default class PgUserConnections extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'returns the number of connections per credential'
  static examples = [heredoc`
    ${color.command('heroku pg:user-connections --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['pg:user_connections']
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgUserConnections)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)
    const output = await psqlService.execQuery(generateUserConnectionsQuery())
    ux.stdout(output)
  }
}
