import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import confirmCommand from '../../lib/confirmCommand'
import pgHost from '../../lib/pg/host'
import {getAddon} from '../../lib/pg/fetcher'
import heredoc from 'tsheredoc'
import {nls} from '../../nls'

export default class Reset extends Command {
  static topic = 'pg';
  static description = 'delete all data in DATABASE';
  static flags = {
    extensions: flags.string({char: 'e', description: 'comma-separated list of extensions to pre-install in the public schema'}),
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Reset)
    const {app, confirm, extensions} = flags
    const db = await getAddon(this.heroku, app, args.database)
    let extensionsArray
    if (extensions) {
      extensionsArray = extensions.split(',')
        .map(ext => ext.trim()
          .toLowerCase())
        .sort()
    }

    await confirmCommand(app, confirm, heredoc(`
      Destructive action
      ${color.addon(db.name)} will lose all of its data
    `))
    ux.action.start(`Resetting ${color.addon(db.name)}`)
    await this.heroku.put(`/client/v11/databases/${db.id}/reset`, {
      body: {extensions: extensionsArray}, hostname: pgHost(),
    })
    ux.action.stop()
  }
}
