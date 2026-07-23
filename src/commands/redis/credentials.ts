import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {redisExtensions} from '@heroku/sdk/extensions/data'
import {Args} from '@oclif/core'

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

    const {data} = new HerokuSDK({extensions: [redisExtensions]})
    const addon = await data.redis.resolveByApp(app, {database})

    if (reset) {
      this.log(`Resetting credentials for ${addon.name}`)
      await data.redis.rotateCredentials(addon.name!)
    } else {
      const redis = await data.redis.info(addon.name!)
      this.log(redis.resource_url)
    }
  }
}
