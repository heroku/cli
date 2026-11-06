import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {type CreateLinkResult, linkExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import {toLinkCommandError} from '../../../lib/pg/links.js'
import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

export default class Create extends Command {
  /* eslint-disable perfectionist/sort-objects */
  // the order of args is important for the command to work
  // TODO: change database to be a flag
  static args = {
    remote: Args.string({description: nls('pg:database:arg:description'), required: true}),
    database: Args.string({description: nls('pg:database:arg:description'), required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static description = 'create a link between data stores'
  static example = `${color.command('heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN')}`
  static flags = {
    app: flags.app({required: true}),
    as: flags.string({description: 'name of link to create'}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<CreateLinkResult> {
    const {args, flags} = await this.parse(Create)
    const {app} = flags
    const {data} = createSDK(this.heroku, {extensions: [linkExtensions]})

    let spinning = false
    try {
      const result = await data.link.createForDatabase(app, args.database, args.remote, {as: flags.as}, {
        beforeCreate({addon, target}) {
          ux.action.start(`Adding link from ${color.datastore(target.name)} to ${color.datastore(addon.name)}`)
          spinning = true
        },
      })
      ux.action.stop(`done, ${color.name(result.link.name)}`)
      return result
    } catch (error) {
      if (spinning) ux.action.stop(color.red('!'))
      throw toLinkCommandError(error)
    }
  }
}
