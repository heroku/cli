import { flags as Flags } from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {
  AddonResolver, getAddonService, isAdvancedDatabase, isEssentialDatabase, isLegacyEssentialDatabase,
} from '@heroku/heroku-cli-util/utils'
import { Args, ux } from '@oclif/core'

import type { Link } from '../../../../lib/data/types.js'

import BaseCommand from '../../../../lib/data/base-command.js'

export default class DataPgLinksCreate extends BaseCommand {
  /* eslint-disable perfectionist/sort-objects */
  static args = {
    remote: Args.string({
      description: 'remote data store name, attachment name, or related config var on an app',
      required: true,
    }),
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  /* eslint-enable perfectionist/sort-objects */
  static description = 'create a link between Advanced-tier data stores'
  static examples = [
    '<%= config.bin %> <%= command.id %> HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN --as example_link_name --app example-app',
  ]
  static flags = {
    app: Flags.app({ required: true }),
    as: Flags.string({ description: 'name for Data Link' }),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DataPgLinksCreate)
    const { app, as } = flags

    const addonResolver = new AddonResolver(this.heroku)
    const [database, target] = await Promise.all([
      addonResolver.resolve(args.database, app, getAddonService()),
      addonResolver.resolve(args.remote, app),
    ])

    if (isEssentialDatabase(database) || isLegacyEssentialDatabase(database)) {
      ux.error("data:pg:links isn't available for Essential-tier databases.")
    }

    if (!isAdvancedDatabase(database)) {
      ux.error('You can only use this command on Advanced-tier databases.\n'
        + `Run ${color.code(`heroku pg:links:create ${args.remote} ${database.name} -a ${app}`)} instead.`)
    }

    try {
      ux.action.start(`Adding link from ${color.datastore(target.name)} to ${color.datastore(database.name)}`)
      const { body: link } = await this.dataApi.post<Link>(`/data/postgres/v1/${database.id}/links`, {
        body: {
          as,
          target: target.name,
        },
      })
      ux.action.stop(`done, ${color.name(link.name)}`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
