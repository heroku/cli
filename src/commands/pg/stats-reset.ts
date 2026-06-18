import {Command, flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {ensureEssentialTierPlan} from '../../lib/pg/extras.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export default class PgStatsReset extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'calls the Postgres functions pg_stat_reset()'
  static examples = [heredoc`
    ${color.command('heroku pg:stats-reset --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['pg:stats_reset']
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgStatsReset)
    const {app} = flags
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(app, args.database)
    await ensureEssentialTierPlan(db)
    const {addon} = await dbResolver.getAttachment(app, args.database)
    const {body} = await this.heroku.put<{message: string}>(`/client/v11/databases/${addon.id}/stats_reset`, {
      hostname: utils.pg.host(),
    })
    ux.stdout(body.message)
  }
}
