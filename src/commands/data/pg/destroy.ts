import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {AddonDestroyFailedError, type DeprovisioningAddOn, isAdvancedDatabase} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/base-command.js'
import {createSDK} from '../../../lib/sdk.js'

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

  async run(): Promise<DeprovisioningAddOn> {
    const {args, flags} = await this.parse(DataPgDestroy)
    const {app, confirm} = flags
    const {database: databaseName} = args
    const force = flags.force || process.env.HEROKU_FORCE === '1'

    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    let destroyed
    try {
      destroyed = await data.postgresDatabase.destroy(databaseName, {
        appIdentity: app,
        async beforeDestroy({addon}) {
          await hux.confirmCommand({
            abortedMessage: `Your database ${addon.name} still exists.`,
            comparison: addon.app.name!,
            confirmation: confirm,
          })
          ux.action.start(`Destroying ${color.addon(addon.name!)} on ${color.app(addon.app.name || '')}`)
        },
        force,
      })
    } catch (error) {
      // Mark the spinner failed. This is a no-op when the failure preceded
      // `beforeDestroy` starting it (resolution, mismatch, or aborted
      // confirmation) — those surface as-is. `AddonDestroyFailedError` is the
      // delete request itself failing after confirmation; it carries the
      // resolved add-on, so wrap it with tier-specific guidance.
      ux.action.stop(color.red('!'))
      if (error instanceof AddonDestroyFailedError) {
        throw isAdvancedDatabase(error.addon)
          ? new Error(`We can't destroy your database due to an error: ${error.message}. Try again or open a ticket with Heroku Support: https://help.heroku.com/`)
          : new Error(`The add-on was unable to be destroyed: ${error.message}.`)
      }

      throw error
    }

    const {addon, result} = destroyed

    if (result.state === 'deprovisioning') {
      ux.action.stop(color.info('pending'))
      ux.stdout(`${color.addon(addon.name!)} is being destroyed in the background. The app will restart when complete...`)
      ux.stdout(`Run ${color.code('heroku addons:info ' + addon.name)} to check destruction progress`)
      return result
    }

    if (result.state !== 'deprovisioned') {
      ux.action.stop(color.red('!'))
      throw isAdvancedDatabase(addon)
        ? new Error(`You can't destroy a database with a ${result.state} status.`)
        : new Error(`The add-on was unable to be destroyed, with status ${result.state}.`)
    }

    ux.action.stop()
    ux.stdout('We successfully destroyed your database.')
    return result
  }
}
