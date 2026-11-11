import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {databaseCommandExtensions, DatabaseNotFollowerError} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirm-command.js'
import {createSDK} from '../../lib/sdk.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc

const formatOrigin = (origin: string, following: string) => {
  const url = new URL(following)
  const fallbackOrigin = `${url.hostname}:${url.port || '5432'}${url.pathname}`
  if (origin === fallbackOrigin && !url.port && process.env.PGPORT) {
    return `${url.hostname}:${process.env.PGPORT}${url.pathname}`
  }

  return origin === fallbackOrigin || origin.includes(':') ? origin : color.name(origin)
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
        async beforeUnfollow({addon, following, origin}) {
          await new ConfirmCommand().confirm(app, confirm, heredoc(`
            Destructive action
            ${color.addon(addon.name)} will become writeable and no longer follow ${formatOrigin(origin, following)}. This cannot be undone.
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
