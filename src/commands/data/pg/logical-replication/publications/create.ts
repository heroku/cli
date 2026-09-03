import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../../lib/data/base-command.js'
import {PublicationTarget, resolveAdvancedDatabase} from '../../../../../lib/data/logical-replication.js'

export default class DataPgLogicalReplicationPublicationsCreate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'create a logical replication publication on a Postgres Advanced database'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --name orders --table public.orders --app example-app',
    '<%= config.bin %> <%= command.id %> DATABASE --name application --schema public --app example-app',
    '<%= config.bin %> <%= command.id %> DATABASE --name application --all-schemas --app example-app',
  ]
  static flags = {
    'all-schemas': Flags.boolean({
      description: 'include all current customer schemas',
      exclusive: ['schema', 'table'],
    }),
    app: Flags.app({required: true}),
    name: Flags.string({description: 'lowercase name for the publication', required: true}),
    remote: Flags.remote(),
    schema: Flags.string({description: 'schema to include, including new tables created in the schema', multiple: true}),
    table: Flags.string({description: 'fully-qualified table to include', multiple: true}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLogicalReplicationPublicationsCreate)
    const addon = await resolveAdvancedDatabase(this, args.database, flags.app)
    const target = this.publicationTarget(flags['all-schemas'], flags.table, flags.schema)

    try {
      ux.action.start(`Creating publication ${color.name(flags.name)} on ${color.datastore(addon.name)}`)
      await this.dataApi.post(`/data/postgres/v1/${addon.id}/logical-replication/publications`, {body: {name: flags.name, target}})
      ux.action.stop()
      if (flags['all-schemas']) {
        ux.stdout('The publication includes all current customer schemas. Tables created later and new schemas are not added automatically.')
      }
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }

  private publicationTarget(allSchemas: boolean, tables?: string[], schemas?: string[]): PublicationTarget {
    if (allSchemas) return {type: 'all_customer_schemas'}

    if (tables && schemas) {
      ux.error('Specify either --table or --schema, not both.')
    }

    if (tables) return {tables, type: 'tables'}
    if (schemas) return {schemas, type: 'schemas'}

    ux.error('Specify --all-schemas, at least one --table, or at least one --schema.')
  }
}
