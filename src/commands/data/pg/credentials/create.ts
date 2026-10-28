import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {databaseCredentialExtensions} from '@heroku/sdk/extensions/data'
import {isAdvancedDatabase} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../../lib/data/base-command.js'
import {createSDK} from '../../../../lib/sdk.js'

const heredoc = tsheredoc

export default class DataPgCredentialsCreate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'create credentials for a Postgres database'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --name my-credential --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    name: Flags.string({char: 'n', description: 'name for the credential', required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgCredentialsCreate)
    const {app, name} = flags
    const {database} = args
    const {data} = createSDK(this.heroku, {extensions: [databaseCredentialExtensions]})

    try {
      ux.action.start(`Creating credential ${color.name(name)}`)
      const {addon} = await data.databaseCredential.create(database, {name}, {appIdentity: app})
      const attachCmd = isAdvancedDatabase(addon)
        ? `heroku data:pg:attachments:create ${addon.name} --credential ${name} -a ${app}`
        : `heroku addons:attach ${addon.name} --credential ${name} -a ${app}`
      const psqlCmd = `heroku pg:psql ${addon.name} -a ${app}`
      ux.stdout(heredoc`
      Attach the credential to the apps you want to use it in with ${color.code(attachCmd)}.
      Define the new grants for the credential in Postgres with ${color.code(psqlCmd)}.
    `)
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
