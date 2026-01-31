import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirmCommand.js'
import redisApi, {RedisApiResponse} from '../../lib/redis/api.js'

const heredoc = tsheredoc.default

export default class StatsReset extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.'}),
  }

  static description = 'reset all stats covered by RESETSTAT (https://redis.io/commands/config-resetstat)'

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  }

  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(StatsReset)
    const {app, confirm} = flags
    const {database} = args
    const addon = await redisApi(app, database, false, this.heroku).getRedisAddon()
    const warning = heredoc(`
      WARNING: Irreversible action.
      All stats covered by RESETSTAT will be reset on ${color.addon(addon.name || '')}.
    `)

    const confirmCommand = new ConfirmCommand()
    await confirmCommand.confirm(app, confirm, warning)

    ux.action.start(`Resetting stats on ${color.addon(addon.name || '')}`)
    const {body: response} = await redisApi(app, database, false, this.heroku)
      .request<RedisApiResponse>(`/redis/v0/databases/${addon.id}/stats/reset`, 'POST', {})
    ux.action.stop(response.message)
  }
}
