import type {AddOn} from '@heroku/types/3.sdk'

import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {type DestroyResult, isAdvancedDatabase} from '@heroku/sdk/resources/data/postgres-database'
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

  async run(): Promise<AddOn> {
    const {args, flags} = await this.parse(DataPgDestroy)
    const {app, confirm} = flags
    const {database: databaseName} = args
    const force = flags.force || process.env.HEROKU_FORCE === '1'

    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    // Captured once the user confirms, so a failed delete below can render
    // tier-specific guidance and so an aborted confirmation stays distinct
    // from a delete failure.
    let confirmedAddon: AddOn | undefined
    let destroyed: DestroyResult

    try {
      destroyed = await data.postgresDatabase.destroy(databaseName, {
        appIdentity: app,
        async beforeDestroy({addon}) {
          await hux.confirmCommand({
            abortedMessage: `Your database ${addon.name} still exists.`,
            comparison: addon.app.name!,
            confirmation: confirm,
          })
          confirmedAddon = addon
          ux.action.start(`Destroying ${color.addon(addon.name!)} on ${color.app(addon.app.name || '')}`)
        },
        force,
      })
    } catch (error) {
      // Resolution and confirmation failures (confirmedAddon still unset)
      // surface as-is. Once confirmed, the only remaining step is the delete
      // request, so wrap its failure with tier-specific guidance.
      if (confirmedAddon) {
        const errorMessage = (error as {body?: {message?: string}}).body?.message || (error as Error).message || error
        throw isAdvancedDatabase(confirmedAddon)
          ? new Error(`We can't destroy your database due to an error: ${errorMessage}. Try again or open a ticket with Heroku Support: https://help.heroku.com/`)
          : new Error(`The add-on was unable to be destroyed: ${errorMessage}.`)
      }

      throw error
    }

    const {addon, result} = destroyed
    // The generated `AddOn['state']` union omits the transient `deprovisioning`
    // value the platform returns while a delete is in flight.
    const state = result.state as string

    if (state === 'deprovisioning') {
      ux.action.stop(color.info('pending'))
    }

    ux.action.stop()

    if (state === 'deprovisioning') {
      ux.stdout(`${color.addon(addon.name!)} is being destroyed in the background. The app will restart when complete...`)
      ux.stdout(`Run ${color.code('heroku addons:info ' + addon.name)} to check destruction progress`)
    } else if (state !== 'deprovisioned') {
      throw isAdvancedDatabase(result)
        ? new Error(`You can't destroy a database with a ${result.state} status.`)
        : new Error(`The add-on was unable to be destroyed, with status ${result.state}.`)
    }

    ux.stdout('We successfully destroyed your database.')
    return result
  }
}
