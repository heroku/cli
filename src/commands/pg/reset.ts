import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {databaseCommandExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirm-command.js'
import {createSDK} from '../../lib/sdk.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc

export default class Reset extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'delete all data in DATABASE'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    extensions: flags.string({char: 'e', description: 'comma-separated list of extensions to pre-install in the public schema'}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run() {
    const {args, flags} = await this.parse(Reset)
    const {app, confirm, extensions} = flags

    let extensionsArray: string[] | undefined
    if (extensions) {
      extensionsArray = extensions.split(',')
        .map((ext: string) => ext.trim()
          .toLowerCase())
        .sort()
    }

    const {data} = createSDK(this.heroku, {extensions: [databaseCommandExtensions]})
    const result = await data.database.resetForApp(app, args.database, {
      async beforeReset({addon}) {
        const confirmCommand = new ConfirmCommand()
        await confirmCommand.confirm(app, confirm, heredoc(`
          Destructive action
          ${color.addon(addon.name)} will lose all of its data
        `))
        ux.action.start(`Resetting ${color.addon(addon.name)}`)
      },
      extensions: extensionsArray,
    })
    ux.action.stop()

    return result
  }
}
