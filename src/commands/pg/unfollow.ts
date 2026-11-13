import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {databaseCommandExtensions, DatabaseNotFollowerError} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirm-command.js'
import {createSDK} from '../../lib/sdk.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc

type UnfollowOrigin
  = | {defaultPort: string, hostname: string, pathname: string, port: string, protocol: string, type: 'url'}
  | {name: string; rawName: string; type: 'config_var',}

const formatOrigin = (origin: UnfollowOrigin) => {
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
    // The published SDK declarations still type origin as a string; newer
    // extension builds pass structured origin details to this callback.
    const database = data.database as unknown as {
      unfollowForApp: (
        app: string,
        identity: string,
        options: {beforeUnfollow?: (preview: {addon: {name: string}; origin: UnfollowOrigin}) => Promise<void> | void},
      ) => ReturnType<typeof data.database.unfollowForApp>
    }

    try {
      const result = await database.unfollowForApp(app, args.database, {
        async beforeUnfollow({addon, origin}) {
          await new ConfirmCommand().confirm(app, confirm, heredoc(`
            Destructive action
            ${color.addon(addon.name)} will become writeable and no longer follow ${formatOrigin(origin)}. This cannot be undone.
          `))
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
