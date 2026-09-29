import {flags as Flags} from '@heroku-cli/command'
import {color, hux, pg, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../../lib/data/base-command.js'
import {LinksResponse} from '../../../../lib/data/types.js'
import {essentialPlan, getAllAdvancedDatabases} from '../../../../lib/pg/util.js'

const heredoc = tsheredoc.default

type AdvancedAddon = pg.ExtendedAddonAttachment['addon'] & {attachment_names?: string[]}

export default class DataPgLinks extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
    }),
  }
  static description = 'lists all databases and information on link'
  static examples = ['<%= config.bin %> <%= command.id %> database_name -a app_name']
  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLinks)
    const {app} = flags
    const {database} = args

    let databases: AdvancedAddon[]
    if (database) {
      const addonResolver = new utils.AddonResolver(this.heroku)
      const addon = await addonResolver.resolve(database, app, utils.pg.addonService())

      if (essentialPlan(addon)) {
        ux.error("data:pg:links isn't available for Essential-tier databases.")
      }

      if (!utils.pg.isAdvancedDatabase(addon)) {
        ux.error(heredoc`
          You can only use this command on Advanced-tier databases.
          Run ${color.code(`heroku pg:links ${addon.name} -a ${app}`)} instead.`)
      }

      databases = [addon]
    } else {
      databases = await getAllAdvancedDatabases(this.heroku, app)
      if (databases.length === 0) {
        ux.error(`No Heroku Postgres Advanced-tier databases found on ${color.app(app)}.`)
      }
    }

    let once = false
    for (const db of databases) {
      const {body: links} = await this.dataApi.get<LinksResponse>(`/data/postgres/v1/${db.id}/links`)

      if (once) {
        ux.stdout('')
      } else {
        once = true
      }

      hux.styledHeader(color.datastore(db.name))

      if (links.length === 0) {
        ux.stdout('No data sources are linked into this database')
        continue
      }

      for (const link of links) {
        ux.stdout(` * ${color.name(link.name)}`)
        const remoteAttachmentName = link.remote?.attachment_name || ''
        const remoteName = link.remote?.name || ''
        const remoteLinkText = `${color.name(remoteAttachmentName)} (${color.datastore(remoteName)})`
        hux.styledObject({
          created_at: link.created_at,
          remote: remoteLinkText,
        })
      }
    }
  }
}
