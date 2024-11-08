import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import redisApi, {RedisFormationResponse} from '../../lib/redis/api'

export default class Credentials extends Command {
  static topic = 'redis'
  static description = 'display credentials information'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    reset: flags.boolean({description: 'reset credentials'}),
  }

  static args = {
    database: Args.string({required: false, description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.'}),
  }

  async run() {
    const {args, flags} = await this.parse(Credentials)
    const {app, reset} = flags
    const {database} = args

    const addon = await redisApi(app, database, false, this.heroku).getRedisAddon()

    if (reset) {
      ux.log(`Resetting credentials for ${addon.name}`)
      await redisApi(app, database, false, this.heroku).request(`/redis/v0/databases/${addon.name}/credentials_rotation`, 'POST')
    } else {
      const {body: redis} = await redisApi(app, database, false, this.heroku).request<RedisFormationResponse>(`/redis/v0/databases/${addon.name}`)
      ux.log(redis.resource_url)
    }
  }
}
