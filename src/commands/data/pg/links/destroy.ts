import {flags as Flags} from '@heroku-cli/command'
import {color, hux, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../../lib/data/base-command.js'
import {essentialPlan} from '../../../../lib/pg/util.js'

const heredoc = tsheredoc.default

export default class DataPgLinksDestroy extends BaseCommand {
  static args = {
    database: Args.string({description: 'local database name, attachment name, or related config var on an app', required: true}),
    link: Args.string({description: 'name of the linked data store', required: true}),
  }
  static description = 'destroys a link between data stores'
  static examples = ['<%= config.bin %> <%= command.id %> HEROKU_POSTGRESQL_CERULEAN red_link -a app_name']
  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLinksDestroy)
    const {app, confirm} = flags
    const {database, link} = args

    const resolver = new utils.AddonResolver(this.heroku)
    const addon = await resolver.resolve(database, app, utils.pg.addonService())

    if (essentialPlan(addon)) {
      ux.error("data:pg:links isn't available for Essential-tier databases.")
    }

    if (!utils.pg.isAdvancedDatabase(addon)) {
      ux.error(heredoc`
        You can only use this command on Advanced-tier databases.
        Run ${color.code(`heroku pg:links:destroy ${addon.name} ${link} -a ${app}`)} instead.`)
    }

    await hux.confirmCommand({
      comparison: app,
      confirmation: confirm,
      warningMessage: heredoc`
        ${color.warning('Destructive action')}
        This command will affect the database ${color.yellow(addon.name!)}
        This will delete ${color.cyan(link)} along with the tables and views created within it.
        This may have adverse effects for software written against the ${color.cyan(link)} schema.
      `,
    })

    ux.action.start(`Destroying link ${color.cyan(link)} from ${color.yellow(addon.name!)}`)
    await this.dataApi.delete(`/data/postgres/v1/${addon.id}/links/${encodeURIComponent(link)}`)
    ux.action.stop()
  }
}
