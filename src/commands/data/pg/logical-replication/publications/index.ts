import {flags as Flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../../lib/data/base-command.js'
import {LogicalReplicationPublicationsResponse, resolveAdvancedDatabase} from '../../../../../lib/data/logical-replication.js'
import {huxTableNoWrapOptions} from '../../../../../lib/utils/table-utils.js'

export default class DataPgLogicalReplicationPublicationsIndex extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'list logical replication publications on a Postgres Advanced database'
  static examples = [
    '<%= config.bin %> <%= command.id %> DATABASE --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    'no-wrap': Flags.noWrap(),
    remote: Flags.remote(),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLogicalReplicationPublicationsIndex)
    const addon = await resolveAdvancedDatabase(this, args.database, flags.app)
    const {body: {publications}} = await this.dataApi.get<LogicalReplicationPublicationsResponse>(`/data/postgres/v1/${addon.id}/logical-replication/publications`)

    if (publications.length === 0) {
      ux.stdout(`No logical replication publications exist on ${addon.name}.`)
      return
    }

    hux.table(publications, {
      Name: {get: publication => publication.name},
      'New Tables': {get: publication => publication.target.automatically_includes_new_tables ? 'included' : 'not included'},
      Owner: {get: publication => publication.owner},
      Target: {
        get: publication => publication.target.type === 'schemas'
          ? `schemas: ${publication.target.schemas.join(', ')}`
          : `tables: ${publication.current_tables.join(', ')}`,
      },
    }, huxTableNoWrapOptions(flags['no-wrap']))
  }
}
