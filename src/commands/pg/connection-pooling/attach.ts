import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {
  type AttachConnectionPoolingResult, connectionPoolingExtensions, EssentialDatabaseNotSupportedError,
} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class Attach extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'add an attachment to a database using connection pooling'
  static examples = [heredoc`
      ${color.command('heroku pg:connection-pooling:attach postgresql-something-12345')}
    `]
  static flags = {
    app: flags.app({required: true}),
    as: flags.string({description: 'name for add-on attachment'}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<AttachConnectionPoolingResult> {
    const {args, flags} = await this.parse(Attach)
    const {app} = flags
    const {data} = createSDK(this.heroku, {extensions: [connectionPoolingExtensions]})

    let spinning = false
    try {
      const result = await data.connectionPooling.attach(app, args.database, {name: flags.as}, {
        onAttached(attachment) {
          ux.action.stop()
          ux.action.start(`Setting ${color.attachment(attachment.name as string)} config vars and restarting ${color.app(app)}`)
        },
        onResolved(addon) {
          ux.action.start(`Enabling Connection Pooling on ${color.datastore(addon.name)} to ${color.app(app)}`)
          spinning = true
        },
      })
      ux.action.stop(result.releaseVersion === undefined ? 'done' : `done, v${result.releaseVersion}`)
      return result
    } catch (error) {
      if (spinning) ux.action.stop(color.red('!'))
      if (error instanceof EssentialDatabaseNotSupportedError) {
        ux.error('You can\'t perform this operation on Essential-tier databases.')
      }

      throw error
    }
  }
}
