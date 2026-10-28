import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {confirmCommand} from '@heroku/heroku-cli-util/hux'
import {databaseCredentialExtensions} from '@heroku/sdk/extensions/data'
import {isAdvancedDatabase} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/base-command.js'
import {createSDK} from '../../../../lib/sdk.js'

export default class DataPgCredentialsDestroy extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'destroy credentials on a Postgres database'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --name my-credential --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    name: Flags.string({char: 'n', description: 'name of credential', required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgCredentialsDestroy)
    const {app, confirm, name} = flags
    const {database} = args
    const {data} = createSDK(this.heroku, {extensions: [databaseCredentialExtensions]})

    await confirmCommand({comparison: app, confirmation: confirm})

    try {
      ux.action.start(`Destroying credential ${color.name(name)}`)
      const {addon} = await data.databaseCredential.destroy(database, name, {appIdentity: app})

      ux.action.stop()
      ux.stdout(`We destroyed the credential ${color.name(name)} in ${color.datastore(addon.name)}.`)
      ux.stdout(`Database objects owned by ${color.name(name)} will be assigned to the `
        + `${isAdvancedDatabase(addon) ? 'owner' : 'default'} credential.`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
