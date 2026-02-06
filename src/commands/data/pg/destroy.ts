import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import destroyAddon from '../../../lib/addons/destroy_addon.js'
import BaseCommand from '../../../lib/data/baseCommand.js'

export default class DataPgDestroy extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'destroy a Postgres Advanced database'

  static examples = ['<%= config.bin %> <%= command.id %> database_name']

  static flags = {
    app: Flags.app(),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    force: Flags.boolean({char: 'f', description: 'destroy even if connected to other apps'}),
    remote: Flags.remote(),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgDestroy)
    const {app, confirm} = flags
    const {database: databaseName} = args
    const force = flags.force || process.env.HEROKU_FORCE === '1'
    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(databaseName, app, utils.pg.addonService())

    if (!utils.pg.isPostgresAddon(addon)) {
      ux.error(`You can only use this command to delete Heroku Postgres databases. Run ${color.code(`heroku addons:destroy ${addon.name}`)} instead.`)
    }

    // prevent deletion of add-on when context.app is set but the addon is
    // attached to a different app
    const addonApp = addon.app!.name!
    const isAppMismatch = app && addonApp !== app
    if (isAppMismatch) {
      ux.error(`Database ${color.yellow(addon.name!)} is on ${color.magenta(addonApp)} not ${color.magenta(app)}. Try again with the correct app.`)
    }

    await hux.confirmCommand({abortedMessage: `Your database ${addon.name} still exists.`, comparison: addon.app!.name!, confirmation: confirm})

    await destroyAddon(this.heroku, addon, force).catch(error => {
      throw error
    })
    ux.stdout('We successfully destroyed your database.')
  }
}
