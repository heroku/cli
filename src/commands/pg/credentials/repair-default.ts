import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class RepairDefault extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'repair the permissions of the default credential within database'
  static example = `${color.command('heroku pg:credentials:repair-default postgresql-something-12345')}`
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c', description: 'set to app name to bypass confirm prompt'}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RepairDefault)
    const {app, confirm} = flags
    const {database} = args
    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    await hux.confirmCommand({
      comparison: app,
      confirmation: confirm,
      warningMessage: heredoc(`
        Destructive Action
        Ownership of all database objects owned by additional credentials will be transferred to the default credential.
        This command will also grant the default credential admin option for all additional credentials.
      `),
    })

    ux.action.start('Resetting permissions and object ownership for default role to factory settings')
    await data.postgresDatabase.repairDefault(app, {addonIdentity: database})
    ux.action.stop()
  }
}
