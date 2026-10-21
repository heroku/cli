import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {confirmCommand} from '@heroku/heroku-cli-util/hux'
import {
  AddonResolver, getAddonService, isAdvancedDatabase, isEssentialDatabase, isLegacyEssentialDatabase,
} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../../lib/data/base-command.js'

const heredoc = tsheredoc

export default class DataPgLinksDestroy extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
    link: Args.string({
      description: 'name of Data Link',
      required: true,
    }),
  }
  static description = 'destroy a link between Advanced-tier data stores'
  static examples = [
    '<%= config.bin %> <%= command.id %> HEROKU_POSTGRESQL_CERULEAN pg-symmetrical-link --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLinksDestroy)
    const {app, confirm} = flags
    const {database, link} = args

    const addonResolver = new AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, getAddonService())

    if (isEssentialDatabase(addon) || isLegacyEssentialDatabase(addon)) {
      ux.error("data:pg:links isn't available for Essential-tier databases.")
    }

    if (!isAdvancedDatabase(addon)) {
      ux.error('You can only use this command on Advanced-tier databases.\n'
        + `Run ${color.code(`heroku pg:links:destroy ${addon.name} ${link} -a ${app}`)} instead.`)
    }

    await confirmCommand({
      comparison: app,
      confirmation: confirm,
      warningMessage: heredoc`
        ${color.warning('Destructive action')}
        This command will affect the database ${color.yellow(addon.name!)}
        This will delete ${color.cyan(link)} along with the tables and views created within it.
        This may have adverse effects for software written against the ${color.cyan(link)} schema.
      `,
    })

    try {
      ux.action.start(`Destroying link ${color.cyan(link)} from ${color.yellow(addon.name!)}`)
      await this.dataApi.delete(`/data/postgres/v1/${addon.id}/links/${encodeURIComponent(link)}`)
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
