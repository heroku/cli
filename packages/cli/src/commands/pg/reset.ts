import {utils} from '@heroku/heroku-cli-util'
import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirmCommand.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

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

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Reset)
    const {app, confirm, extensions} = flags
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, args.database)

    let extensionsArray
    if (extensions) {
      extensionsArray = extensions.split(',')
        .map((ext: string) => ext.trim()
          .toLowerCase())
        .sort()
    }

    const confirmCommand = new ConfirmCommand()
    await confirmCommand.confirm(app, confirm, heredoc(`
      Destructive action
      ${color.addon(db.name)} will lose all of its data
    `))
    ux.action.start(`Resetting ${color.addon(db.name)}`)
    await this.heroku.put(`/client/v11/databases/${db.id}/reset`, {
      body: {extensions: extensionsArray}, hostname: utils.pg.host(),
    })
    ux.action.stop()
  }
}
