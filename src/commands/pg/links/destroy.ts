import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {type DeleteLinkResult, linkExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../../lib/confirm-command.js'
import {toLinkCommandError} from '../../../lib/pg/links.js'
import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

const heredoc = tsheredoc

export default class Destroy extends Command {
  static args = {
    database: Args.string({description: nls('pg:database:arg:description'), required: true}),
    link: Args.string({description: 'name of the linked data store', required: true}),
  }
  static description = 'destroys a link between data stores'
  static example = `${color.command('heroku pg:links:destroy HEROKU_POSTGRESQL_CERULEAN redis-symmetrical-100')}`
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<DeleteLinkResult> {
    const {args, flags} = await this.parse(Destroy)
    const {app, confirm} = flags
    const {database, link} = args
    const {data} = createSDK(this.heroku, {extensions: [linkExtensions]})

    let spinning = false
    try {
      const result = await data.link.deleteFromDatabase(app, database, link, {
        async beforeDelete({addon}) {
          await new ConfirmCommand().confirm(app, confirm, heredoc(`
            Destructive action
            This command will affect the database ${color.yellow(addon.name)}
            This will delete ${color.cyan(link)} along with the tables and views created within it.
            This may have adverse effects for software written against the ${color.cyan(link)} schema.
          `))
          ux.action.start(`Destroying link ${color.cyan(link)} from ${color.yellow(addon.name)}`)
          spinning = true
        },
      })
      ux.action.stop()
      return result
    } catch (error) {
      if (spinning) ux.action.stop(color.red('!'))
      throw toLinkCommandError(error)
    }
  }
}
