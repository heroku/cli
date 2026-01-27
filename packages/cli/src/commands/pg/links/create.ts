import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import type {Link} from '../../../lib/pg/types.js'

import {addonResolver} from '../../../lib/addons/resolve.js'
import {essentialPlan} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

export default class Create extends Command {
  /* eslint-disable perfectionist/sort-objects */
  // the order of args is important for the command to work
  // TODO: change database to be a flag, which would be consistent with apps:rename
  static args = {
    remote: Args.string({description: nls('pg:database:arg:description'), required: true}),
    database: Args.string({description: nls('pg:database:arg:description'), required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */

  static description = 'create a link between data stores'

  static example = `${color.command('heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN')}`

  static flags = {
    app: flags.app({required: true}),
    as: flags.string({description: 'name of link to create'}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Create)
    const {app} = flags

    const service = async (remoteId: string) => {
      const addon = await addonResolver(this.heroku, app, remoteId)
      if (!addon.plan.name.match(/^heroku-(redis|postgresql)/))
        throw new Error('Remote database must be heroku-redis or heroku-postgresql')
      return addon
    }

    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const [{addon: db}, target] = await Promise.all([
      dbResolver.getAttachment(app, args.database),
      service(args.remote),
    ])

    if (essentialPlan(db))
      throw new Error("pg:links isn't available for Essential-tier databases.")
    if (essentialPlan(target as any))
      throw new Error("pg:links isn't available for Essential-tier databases.")

    ux.action.start(`Adding link from ${color.datastore(target.name)} to ${color.datastore(db.name)}`)
    const {body: link} = await this.heroku.post<Link>(`/client/v11/databases/${db.id}/links`, {
      body: {
        as: flags.as,
        target: target.name,
      },
      hostname: utils.pg.host(),
    })

    // This doesn't exist according to Shogun's link serializer. May it be that the original idea was to use to catch
    // a Data API error and then show an re-throw the error here?
    // if (link.message) {
    //   throw new Error(link.message)
    // }

    ux.action.stop(`done, ${color.name(link.name)}`)
  }
}
