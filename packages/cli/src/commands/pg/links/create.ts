import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'
const heredoc = tsheredoc.default
import {addonResolver} from '../../../lib/addons/resolve.js'
import {utils} from '@heroku/heroku-cli-util'
import type {Link} from '../../../lib/pg/types.js'
import {essentialPlan} from '../../../lib/pg/util.js'
import {nls} from '../../../nls.js'

export default class Create extends Command {
  static topic = 'pg'
  static description = heredoc(`
  create a link between data stores
  Example:
  heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN
  `)

  static flags = {
    as: flags.string({description: 'name of link to create'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    remote: Args.string({required: true, description: nls('pg:database:arg:description')}),
    database: Args.string({required: true, description: nls('pg:database:arg:description')}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Create)
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

    ux.action.start(`Adding link from ${color.yellow(target.name)} to ${color.yellow(db.name)}`)
    const {body: link} = await this.heroku.post<Link>(`/client/v11/databases/${db.id}/links`, {
      body: {
        target: target.name,
        as: flags.as,
      },
      hostname: utils.pg.host(),
    })

    // This doesn't exist according to Shogun's link serializer. May it be that the original idea was to use to catch
    // a Data API error and then show an re-throw the error here?
    // if (link.message) {
    //   throw new Error(link.message)
    // }

    ux.action.stop(`done, ${color.cyan(link.name)}`)
  }
}
