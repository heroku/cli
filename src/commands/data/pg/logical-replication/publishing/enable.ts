import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../../lib/data/base-command.js'
import {resolveAdvancedDatabase} from '../../../../../lib/data/logical-replication.js'

export default class DataPgLogicalReplicationPublishingEnable extends BaseCommand {
  static aliases = ['data:pg:lr:publishing:enable']
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'enable logical replication publishing for a Postgres Advanced database'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLogicalReplicationPublishingEnable)
    const addon = await resolveAdvancedDatabase(this, args.database, flags.app)

    try {
      ux.action.start(`Enabling logical replication publishing for ${color.datastore(addon.name)}`)
      await this.dataApi.post(`/data/postgres/v1/${addon.id}/logical-replication/publishing/enable`)
      ux.action.stop('requested')
      ux.stdout(`Wait for ${color.datastore(addon.name)} to finish updating before creating publications. Use ${color.code(`heroku data:pg:info ${addon.name} --app ${flags.app}`)} to track progress.`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
