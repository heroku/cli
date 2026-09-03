import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../../lib/data/base-command.js'
import {resolveAdvancedDatabase} from '../../../../../lib/data/logical-replication.js'

export default class DataPgLogicalReplicationPublicationsDestroy extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'destroy a logical replication publication'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --name orders --app example-app --confirm example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    name: Flags.string({description: 'name of the publication', required: true}),
    remote: Flags.remote(),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLogicalReplicationPublicationsDestroy)
    const addon = await resolveAdvancedDatabase(this, args.database, flags.app)
    await hux.confirmCommand({comparison: flags.app, confirmation: flags.confirm})

    try {
      ux.action.start(`Destroying publication ${color.name(flags.name)} on ${color.datastore(addon.name)}`)
      await this.dataApi.delete(`/data/postgres/v1/${addon.id}/logical-replication/publications/${encodeURIComponent(flags.name)}`)
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
