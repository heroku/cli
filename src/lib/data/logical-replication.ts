import type {pg} from '@heroku/heroku-cli-util'

import {color, utils} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core'

import type BaseCommand from './base-command.js'

export type PublicationTarget
  = | {schemas: string[], type: 'schemas'}
    | {tables: string[], type: 'tables'}
    | {type: 'all_customer_schemas'}

type PublicationResponseTarget
  = | {
    automatically_includes_new_schemas: boolean
    automatically_includes_new_tables: boolean
    schemas: string[]
    type: 'schemas'
  }
    | {
      automatically_includes_new_schemas: boolean
      automatically_includes_new_tables: boolean
      tables: string[]
      type: 'tables'
    }

export type LogicalReplicationPublication = {
  current_tables: string[]
  name: string
  owner: string
  target: PublicationResponseTarget
}

export type LogicalReplicationPublicationsResponse = {
  publications: LogicalReplicationPublication[]
}

export type LogicalReplicationPublicationResponse = {
  publication: LogicalReplicationPublication
}

export async function resolveAdvancedDatabase(command: BaseCommand, database: string, app: string): Promise<pg.ExtendedAddon> {
  const addonResolver = new utils.AddonResolver(command.heroku)
  const addon = await addonResolver.resolve(database, app, utils.pg.addonService())

  if (!utils.pg.isAdvancedDatabase(addon)) {
    ux.error(`You can only use this command on Advanced-tier databases.\nUse ${color.code(`heroku data:pg:info ${database} --app ${app}`)} to inspect an Advanced database.`)
  }

  return addon
}
