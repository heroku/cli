import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class Url extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'show information on a database credential'
  static flags = {
    app: flags.app({required: true}),
    name: flags.string({
      char: 'n',
      default: 'default',
      description: 'which credential to show (default credentials if not specified)',
    }),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Url)
    const {app, name} = flags
    const {database} = args
    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    const {credentialConnectionInfo: credInfo} = await data.postgresDatabase.getUrl(app, name, {addonIdentity: database})

    ux.stdout(heredoc(`
      Connection information for ${color.yellow(name)} credential.
      Connection info string:
        "dbname=${credInfo.database} host=${credInfo.host} port=${credInfo.port} user=${credInfo.user} password=${credInfo.password} sslmode=require"
      Connection URL:
        ${credInfo.url}
    `))
  }
}
