import {flags as Flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'

import BaseCommand from '../../../../../lib/data/base-command.js'
import {LogicalReplicationPublication, resolveAdvancedDatabase} from '../../../../../lib/data/logical-replication.js'

export default class DataPgLogicalReplicationPublicationsInfo extends BaseCommand {
  static aliases = ['data:pg:lr:publications:info']
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'show details of a logical replication publication on a Postgres Advanced database'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --name orders --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    name: Flags.string({description: 'name of publication', required: true}),
    remote: Flags.remote(),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLogicalReplicationPublicationsInfo)
    const addon = await resolveAdvancedDatabase(this, args.database, flags.app)
    const {body: publication} = await this.dataApi.get<LogicalReplicationPublication>(`/data/postgres/v1/${addon.id}/logical-replication/publications/${encodeURIComponent(flags.name)}`)
    const target = publication.target.type === 'schemas' ? publication.target.schemas.join(', ') : publication.current_tables.join(', ')

    hux.styledObject({
      'Current Tables': publication.current_tables.join(', '),
      Name: publication.name,
      'New Tables': publication.target.automatically_includes_new_tables ? 'Included' : 'Not Included',
      Owner: publication.owner,
      Target: `${publication.target.type}: ${target}`,
    }, ['Name', 'Owner', 'Target', 'Current Tables', 'New Tables'])
  }
}
