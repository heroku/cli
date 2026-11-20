import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {
  databaseCommandExtensions,
  DatabaseNotFollowerError,
  type UnfollowDatabaseOrigin,
} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {createSDK} from '../../lib/sdk.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc

const formatOrigin = (origin: UnfollowDatabaseOrigin) => {
  if (origin.type === 'config_var') {
    return color.name(origin.name)
  }

  const {defaultPort, hostname, pathname, port} = origin
  const displayPort = port || process.env.PGPORT || defaultPort
  return `${hostname}:${displayPort}${pathname}`
}

export default class Unfollow extends Command {
  static args = {
    database: Args.string({description: nls('pg:database:arg:description'), required: true}),
  }
  static description = 'stop a replica from following and make it a writeable database'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run() {
    const {args, flags} = await this.parse(Unfollow)
    const {app, confirm} = flags
    const {data} = createSDK(this.heroku, {extensions: [databaseCommandExtensions]})

    try {
      const result = await data.database.unfollowForApp(app, args.database, {
        async beforeUnfollow({addon, origin}) {
          await hux.confirmCommand({
            comparison: app,
            confirmation: confirm,
            warningMessage: heredoc(`
              Destructive action
              ${color.addon(addon.name)} will become writeable and no longer follow ${formatOrigin(origin)}. This cannot be undone.
            `),
          })
          ux.action.start(`${color.addon(addon.name)} unfollowing`)
        },
      })

      ux.action.stop()
      return result
    } catch (error) {
      if (error instanceof DatabaseNotFollowerError) {
        ux.error(`${color.addon(error.addon.name)} is not a follower`)
      }

      throw error
    }
  }
}
