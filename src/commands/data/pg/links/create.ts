import {flags as Flags} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {addonResolver} from '../../../../lib/addons/resolve.js'
import BaseCommand from '../../../../lib/data/base-command.js'
import {Link} from '../../../../lib/data/types.js'
import {essentialPlan} from '../../../../lib/pg/util.js'

const heredoc = tsheredoc.default

const LINK_NAME_PATTERN = /^[a-z][a-z0-9_]*$/

export default class DataPgLinksCreate extends BaseCommand {
  /* eslint-disable perfectionist/sort-objects */
  static args = {
    remote: Args.string({description: 'remote database name or attachment name', required: true}),
    database: Args.string({description: 'local database name, attachment name, or related config var on an app', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static description = 'create a link between data stores'
  static examples = ['<%= config.bin %> <%= command.id %> HEROKU_POSTGRESQL_RED HEROKU_POSTGRESQL_CERULEAN --as red_link -a app_name']
  static flags = {
    app: Flags.app({required: true}),
    as: Flags.string({description: 'name of link to create', required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLinksCreate)
    const {app, as} = flags

    if (as.length > 63 || !LINK_NAME_PATTERN.test(as) || as.startsWith('pg_')) {
      ux.error("Link name must be 63 alphanumeric characters or less, start with a lowercase letter, and not begin with 'pg_'.")
    }

    const resolver = new utils.AddonResolver(this.heroku)
    const [database, target] = await Promise.all([
      resolver.resolve(args.database, app, utils.pg.addonService()),
      addonResolver(this.heroku, app, args.remote),
    ])

    if (essentialPlan(database)) {
      ux.error("data:pg:links isn't available for Essential-tier databases.")
    }

    if (!utils.pg.isAdvancedDatabase(database)) {
      ux.error(heredoc`
        You can only use this command on Advanced-tier databases.
        Run ${color.code(`heroku pg:links:create ${args.remote} ${database.name} -a ${app}`)} instead.`)
    }

    if (!/^heroku-(redis|postgresql)/.test(target.plan.name)) {
      ux.error('Remote database must be heroku-redis or heroku-postgresql')
    }

    if (essentialPlan(target as any)) {
      ux.error("data:pg:links isn't available for Essential-tier databases.")
    }

    ux.action.start(`Adding link from ${color.datastore(target.name)} to ${color.datastore(database.name)}`)
    const {body: link} = await this.dataApi.post<Link>(`/data/postgres/v1/${database.id}/links`, {
      body: {
        as,
        target: target.name,
      },
    })
    ux.action.stop(`done, ${color.name(link.name)}`)
  }
}
