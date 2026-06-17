import {Command, flags} from '@heroku-cli/command'
import {color, pg, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {essentialNumPlan} from '../../lib/pg/extras.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export function generateExtensionsQuery(db: pg.ConnectionDetails): string {
  return essentialNumPlan(db.attachment!.addon)
    ? `SELECT *
                     FROM pg_available_extensions
                     WHERE name IN (SELECT unnest(string_to_array(current_setting('rds.allowed_extensions'), ',')))`
    : `SELECT *
                     FROM pg_available_extensions
                     WHERE name IN (SELECT unnest(string_to_array(current_setting('extwlist.extensions'), ',')))`
}

export default class PgExtensions extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'list available and installed extensions'
  static examples = [heredoc`
    ${color.command('heroku pg:extensions --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgExtensions)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)
    const query = generateExtensionsQuery(db)
    const output = await psqlService.execQuery(query)
    ux.stdout(output)
  }
}
