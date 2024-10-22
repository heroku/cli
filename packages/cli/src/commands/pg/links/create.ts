import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {addonResolver} from '../../../lib/addons/resolve'
import {getAddon} from '../../../lib/pg/fetcher'
import host from '../../../lib/pg/host'
import type {AddOnAttachmentWithConfigVarsAndPlan, Link} from '../../../lib/pg/types'
import {essentialPlan} from '../../../lib/pg/util'

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
    remote: Args.string({required: true, description: 'config var exposed to the owning app containing the remote heroku-redis or heroku-postgresql database URL'}),
    database: Args.string({required: true, description: 'config var exposed to the owning app containing the database configuration'}),
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

    const [db, target] = await Promise.all([
      getAddon(this.heroku, app, args.database),
      service(args.remote),
    ]) as [AddOnAttachmentWithConfigVarsAndPlan, AddOnAttachmentWithConfigVarsAndPlan]

    if (essentialPlan(db))
      throw new Error('pg:links isn’t available for Essential-tier databases.')
    if (essentialPlan(target))
      throw new Error('pg:links isn’t available for Essential-tier databases.')

    ux.action.start(`Adding link from ${color.yellow(target.name)} to ${color.yellow(db.name)}`)
    const {body: link} = await this.heroku.post<Link>(`/client/v11/databases/${db.id}/links`, {
      body: {
        target: target.name,
        as: flags.as,
      },
      hostname: host(),
    })

    if (link.message) {
      throw new Error(link.message)
    }

    ux.action.stop(`done, ${color.cyan(link.name)}`)
  }
}
