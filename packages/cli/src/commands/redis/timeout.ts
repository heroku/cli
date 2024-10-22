import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import redisApi from '../../lib/redis/api'

type RedisConfigResponse = {
  timeout: {
    value: number
  }
}

export default class Timeout extends Command {
  static topic = 'redis'
  static description = `set the number of seconds to wait before killing idle connections
    A value of zero means that connections will not be closed.
  `

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    seconds: flags.integer({char: 's', description: 'set timeout value', required: true}),
  }

  static args = {
    database: Args.string({description: 'name of the Redis database. If omitted, we use the primary Redis instance associated with the app.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Timeout)
    const {app, seconds} = flags
    const {database} = args
    const addon = await redisApi(app, database, false, this.heroku).getRedisAddon()
    const {body: response} = await redisApi(app, database, false, this.heroku)
      .request<RedisConfigResponse>(`/redis/v0/databases/${addon.id}/config`, 'PATCH', {timeout: seconds})
    ux.log(`Timeout for ${addon.name} (${addon.config_vars.join(', ')}) set to ${response.timeout.value} seconds.`)
    if (response.timeout.value === 0) {
      ux.log('Connections to the Redis instance can idle indefinitely.')
    } else {
      ux.log(`Connections to the Redis instance will be stopped after idling for ${response.timeout.value} seconds.`)
    }
  }
}
