import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'

import redisApi, {RedisFormationResponse} from '../../lib/redis/api.js'

export default class Credentials extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.', required: false}),
  }

  static description = 'display credentials information'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    reset: flags.boolean({description: 'reset credentials'}),
  }

  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Credentials)
    const {app, reset} = flags
    const {database} = args

    const addon = await redisApi(app, database, false, this.heroku).getRedisAddon()

    if (reset) {
      this.log(`Resetting credentials for ${addon.name}`)
      await redisApi(app, database, false, this.heroku).request(`/redis/v0/databases/${addon.name}/credentials_rotation`, 'POST', {})
    } else {
      const {body: redis} = await redisApi(app, database, false, this.heroku).request<RedisFormationResponse>(`/redis/v0/databases/${addon.name}`)
      this.log(redis.resource_url)
    }
  }
}
