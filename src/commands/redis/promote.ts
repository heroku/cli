import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {redisExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

export default class Promote extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.', required: false}),
  }
  static description = 'sets DATABASE as your REDIS_URL'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Promote)
    const {app} = flags
    const {database} = args

    const {data, platform} = new HerokuSDK({extensions: [redisExtensions]})
    const addon = await data.redis.resolveByApp(app, {database})

    const addons = await platform.addOn.listByApp(app)
    const redisWithUrl = addons.filter(a => {
      const service = a.addon_service?.name
      if (!service || !service.startsWith('heroku-redis')) return false
      return (a.config_vars || []).some(cv => cv.toUpperCase().includes('REDIS_URL'))
    })

    if (redisWithUrl.length === 1 && (redisWithUrl[0].config_vars || []).filter(c => c.endsWith('_URL')).length === 1) {
      const attachment = redisWithUrl[0]
      await platform.addOnAttachment.create({
        addon: attachment.name!, app, confirm: app,
      })
    }

    ux.stdout(`Promoting ${addon.name} to REDIS_URL on ${app}`)
    await platform.addOnAttachment.create({
      addon: addon.name!, app, confirm: app, name: 'REDIS',
    })
  }
}
