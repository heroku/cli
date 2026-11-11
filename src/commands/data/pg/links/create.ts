import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {isAdvancedDatabase, isLegacyDatabase} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import type {Link} from '../../../../lib/data/types.js'

import {addonResolver} from '../../../../lib/addons/resolve.js'
import BaseCommand from '../../../../lib/data/base-command.js'
import {getAdvancedAttachment} from '../../../../lib/pg/util.js'

export default class DataPgLinksCreate extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database attachment name or related config var on an app',
      required: true,
    }),
    remote: Args.string({
      description: 'remote data store name, attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'create a link between Advanced-tier data stores'
  static examples = [
    '<%= config.bin %> <%= command.id %> HEROKU_POSTGRESQL_RED HEROKU_POSTGRESQL_CERULEAN --as example_link_name --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    as: Flags.string({description: 'name for Data Link'}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgLinksCreate)
    const {app, as} = flags

    const [{addon: database}, target] = await Promise.all([
      getAdvancedAttachment(this.heroku, app, args.database),
      addonResolver(this.heroku, app, args.remote),
    ])

    const unsupportedTierError = 'You can only use this command to create Data Links on Advanced-tier databases.'
    if (!isAdvancedDatabase(database as any) || isLegacyDatabase(target as any)) {
      if (isLegacyDatabase(database as any) && isLegacyDatabase(target as any)) {
        ux.error(`${unsupportedTierError}\n`
          + `Use ${color.code(`heroku pg:links:create ${args.remote} ${database.name} -a ${app}`)} instead.`)
      }

      ux.error(unsupportedTierError)
    }

    try {
      ux.action.start(`Adding link from ${color.datastore(target.name)} to ${color.datastore(database.name)}`)
      const {body: link} = await this.dataApi.post<Link>(`/data/postgres/v1/${database.id}/links`, {
        body: {
          as,
          target: target.id,
        },
      })
      ux.action.stop(`done, ${color.name(link.name)}`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
