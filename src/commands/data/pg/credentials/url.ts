import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {databaseCredentialExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../../lib/data/base-command.js'
import {createSDK} from '../../../../lib/sdk.js'

const heredoc = tsheredoc

export default class Url extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'show information on a Postgres database credential'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --app myapp',
  ]
  static flags = {
    app: Flags.app({required: true}),
    name: Flags.string({
      char: 'n',
      description: '[default: owner or default credential, if not specified] credential to show',
    }),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Url)
    const {app, name} = flags
    const {database} = args
    const {data} = createSDK(this.heroku, {extensions: [databaseCredentialExtensions]})

    const {credentialConnectionInfo: credentialInfo} = await data.databaseCredential.getUrl(database, name, {appIdentity: app})

    hux.styledHeader(`Connection information for ${color.name(credentialInfo.credName)} credential:`)

    ux.stdout(heredoc`
      Connection info string:
      ${color.info(`"dbname=${credentialInfo.database} host=${credentialInfo.host} port=${credentialInfo.port} user=${credentialInfo.user} password=${credentialInfo.password} sslmode=require"`)}

      Connection URL:
      ${color.info(credentialInfo.url)}
    `)
  }
}
