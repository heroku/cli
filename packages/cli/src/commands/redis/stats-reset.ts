import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import redisApi, {RedisApiResponse} from '../../lib/redis/api'
import confirmCommand from '../../lib/confirmCommand'
import heredoc from 'tsheredoc'
import color from '@heroku-cli/color'

export default class StatsReset extends Command {
  static topic = 'redis'
  static description = 'reset all stats covered by RESETSTAT (https://redis.io/commands/config-resetstat)'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    confirm: flags.string({char: 'c'}),
  }

  static args = {
    database: Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(StatsReset)
    const {app, confirm} = flags
    const {database} = args
    const addon = await redisApi(app, database, false, this.heroku).getRedisAddon()
    const warning = heredoc(`
      WARNING: Irreversible action.
      All stats covered by RESETSTAT will be reset on ${color.addon(addon.name || '')}.
    `)
    await confirmCommand(app, confirm, warning)

    ux.action.start(`Resetting stats on ${color.addon(addon.name || '')}`)
    const {body: response} = await redisApi(app, database, false, this.heroku)
      .request<RedisApiResponse>(`/redis/v0/databases/${addon.id}/stats/reset`, 'POST')
    ux.action.stop(response.message)
  }
}
