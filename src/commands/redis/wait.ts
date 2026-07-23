import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {NotFoundError} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {redisExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

export default class Wait extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.', required: false}),
  }
  static description = 'wait for Redis instance to be available'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    'wait-interval': flags.string({description: 'how frequently to poll in seconds'}),
  }
  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Wait)
    const {app, 'wait-interval': waitInterval} = flags
    const {database} = args

    const {data} = new HerokuSDK({extensions: [redisExtensions]})
    const addon = await data.redis.resolveByApp(app, {database})

    let intervalSeconds = waitInterval && Number.parseInt(waitInterval, 10)
    if (!intervalSeconds || intervalSeconds < 0) intervalSeconds = 5

    let firstStatus
    try {
      firstStatus = await data.redis.wait(addon.name!)
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error
      firstStatus = {message: 'not found', 'waiting?': true}
    }

    if (!firstStatus['waiting?']) return

    ux.action.start(`Waiting for database ${color.datastore(addon.name!)}`, firstStatus.message)
    const result = await data.redis.waitForReady(addon.name!, {intervalMs: intervalSeconds * 1000})
    ux.action.stop(result.message)
  }
}
