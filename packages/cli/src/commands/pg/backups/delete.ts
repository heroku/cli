import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {host} from '../lib/host'

export default class Delete extends Command {
    static topic = 'pg';
    static description = 'delete a backup';
    static flags = {
      confirm: flags.string({char: 'c'}),
      app: flags.app({required: true}),
    };

    static args = {
      backup_id: Args.string({required: true}),
    };

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(Delete)
      const pgbackups = require('../../lib/pgbackups')(context, heroku)
      const {app, args, flags} = context
      await cli.confirmApp(app, flags.confirm)
      await ux.action(`Deleting backup ${color.cyan(args.backup_id)} on ${color.magenta(app)}`, (async function () {
        let num = await pgbackups.transfer.num(args.backup_id)
        if (!num)
          throw new Error(`Invalid Backup: ${args.backup_id}`)
        await this.heroku.delete(`/client/v11/apps/${app}/transfers/${num}`, {host})
      })())
    }
}
