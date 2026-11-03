import type {AddOn} from '@heroku/types/3.sdk'

import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {addOnExtensions} from '@heroku/sdk/extensions/platform'
import {getPostgresServiceName, isAdvancedDatabase} from '@heroku/sdk/resources/data/postgres-database'
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

    const {platform} = createSDK(this.heroku, {extensions: [addOnExtensions]})
    const addon = await platform.addOn.resolve(databaseName, {
      addonService: getPostgresServiceName(),
      appIdentity: app,
    })

    // prevent deletion of add-on when context.app is set but the addon is
    // attached to a different app
    const addonApp = addon.app!.name!
    const isAppMismatch = app && addonApp !== app
    if (isAppMismatch) {
      ux.error(`Database ${color.yellow(addon.name!)} is on ${color.magenta(addonApp)} not ${color.magenta(app)}. Try again with the correct app.`)
    }

    await hux.confirmCommand({abortedMessage: `Your database ${addon.name} still exists.`, comparison: addon.app!.name!, confirmation: confirm})

    const addonResponse = await this.destroyDatabase(platform, addon, force)
    ux.stdout('We successfully destroyed your database.')
    return addonResponse
  }

  private async destroyDatabase(
    platform: ReturnType<typeof createSDK>['platform'],
    addon: AddOn,
    force: boolean,
  ): Promise<AddOn> {
    const addonName = addon.name || ''

    ux.action.start(`Destroying ${color.addon(addonName)} on ${color.app(addon.app?.name || '')}`)

    // The `force` body is scoped to the delete call; `Accept-Expansion: plan`
    // returns the plan so the advanced-tier checks below can run.
    const deleteClient = platform
      .withHeaders({'Accept-Expansion': 'plan'})
      .withOptions({body: {force}})

    let addonResponse: AddOn
    try {
      addonResponse = await deleteClient.addOn.delete(addon.app!.id!, addon.id!)
    } catch (error) {
      const errorMessage = (error as {body?: {message?: string}}).body?.message || error
      throw isAdvancedDatabase(addon)
        ? new Error(`We can't destroy your database due to an error: ${errorMessage}. Try again or open a ticket with Heroku Support: https://help.heroku.com/`)
        : new Error(`The add-on was unable to be destroyed: ${errorMessage}.`)
    }

    // The generated `AddOn['state']` union omits the transient `deprovisioning`
    // value the platform returns while a delete is in flight.
    const state = addonResponse.state as string

    if (state === 'deprovisioning') {
      ux.action.stop(color.info('pending'))
    }

    ux.action.stop()

    if (state === 'deprovisioning') {
      ux.stdout(`${color.addon(addonName)} is being destroyed in the background. The app will restart when complete...`)
      ux.stdout(`Run ${color.code('heroku addons:info ' + addonName)} to check destruction progress`)
    } else if (state !== 'deprovisioned') {
      throw isAdvancedDatabase(addonResponse)
        ? new Error(`You can't destroy a database with a ${addonResponse.state} status.`)
        : new Error(`The add-on was unable to be destroyed, with status ${addonResponse.state}.`)
    }

    return addonResponse
  }
}
