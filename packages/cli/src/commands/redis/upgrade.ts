import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import redisApi, {RedisApiResponse} from '../../lib/redis/api'
import confirmCommand from '../../lib/confirmCommand'
import heredoc from 'tsheredoc'
import color from '@heroku-cli/color'

export default class Upgrade extends Command {
  static topic = 'redis'
  static description = 'perform in-place version upgrade'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    version: flags.string({char: 'v', required: true}),
    confirm: flags.string({char: 'c'}),
  }

  static args = {
    database: Args.string({description: 'Name of the Redis database. If omitted, it will default to the primary Redis instance associated with the app.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Upgrade)
    const {app, version, confirm} = flags
    const {database} = args
    const addon = await redisApi(app, database, false, this.heroku).getRedisAddon()
    const warning = heredoc(`
      WARNING: Irreversible action.
      Redis database will be upgraded to ${color.configVar(version)}. This cannot be undone.
    `)
    await confirmCommand(app, confirm, warning)

    ux.action.start(`Requesting upgrade of ${color.addon(addon.name || '')} to ${version}`)
    const {body: response} = await redisApi(app, database, false, this.heroku)
      .request<RedisApiResponse>(`/redis/v0/databases/${addon.id}/upgrade`, 'POST', {version: version})
    ux.action.stop(response.message)
  }
}
