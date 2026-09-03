import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../../lib/data/base-command.js'
import {PublicationTarget, resolveAdvancedDatabase} from '../../../../../lib/data/logical-replication.js'

export default class DataPgLogicalReplicationPublicationsUpdate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'replace the target of a logical replication publication'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --name orders --table public.orders --app example-app',
    '<%= config.bin %> <%= command.id %> DATABASE --name application --schema public --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    name: Flags.string({description: 'name of the publication', required: true}),
    remote: Flags.remote(),
    schema: Flags.string({description: 'schema to include, including new tables created in the schema', multiple: true}),
    table: Flags.string({description: 'fully-qualified table to include', multiple: true}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLogicalReplicationPublicationsUpdate)
    const addon = await resolveAdvancedDatabase(this, args.database, flags.app)
    const target = this.publicationTarget(flags.table, flags.schema)

    try {
      ux.action.start(`Updating publication ${color.name(flags.name)} on ${color.datastore(addon.name)}`)
      await this.dataApi.put(`/data/postgres/v1/${addon.id}/logical-replication/publications/${encodeURIComponent(flags.name)}`, {body: {target}})
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }

  private publicationTarget(tables?: string[], schemas?: string[]): PublicationTarget {
    if (tables && schemas) {
      ux.error('Specify either --table or --schema, not both.')
    }

    if (tables) return {tables, type: 'tables'}
    if (schemas) return {schemas, type: 'schemas'}

    ux.error('Specify at least one --table or --schema.')
  }
}
