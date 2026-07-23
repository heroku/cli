import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {NotFoundError} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {Args} from '@oclif/core'

const ADDON_SERVICE_PREFIX = process.env.HEROKU_REDIS_ADDON_NAME || 'heroku-redis'

export default class Info extends Command {
  static aliases = ['redis']
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.'}),
  }
  static description = 'gets information about redis'
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    remote: flags.remote(),
  }
  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Info)
    const {app, json} = flags
    const {database} = args

    const {data, platform} = new HerokuSDK()
    const addons = await platform.addOn.listByApp(app)
    const filter = database?.toUpperCase()
    const redisAddons = addons.filter(addon => {
      const service = addon.addon_service?.name
      if (!service || !service.startsWith(ADDON_SERVICE_PREFIX)) return false
      if (!filter) return true
      const configVars = addon.config_vars || []
      return configVars.some(cv => cv.toUpperCase().includes(filter))
        || (addon.name?.toUpperCase().includes(filter) ?? false)
    })

    const databases = redisAddons.map(addon => ({
      addon,
      redis: data.redis.info(addon.name!).catch((error: unknown) => {
        if (error instanceof NotFoundError) return null
        throw error
      }),
    }))

    if (json) {
      const redii = []
      for (const db of databases) {
        const redis = await db.redis
        if (!redis) continue
        const {formation, metaas_source, port, ...filteredRedis} = redis
        redii.push({...filteredRedis, config_vars: db.addon.config_vars})
      }

      hux.styledJSON(redii)
      return
    }

    for (const db of databases) {
      const redis = await db.redis
      if (!redis) continue
      const configVars = db.addon.config_vars || []
      hux.styledHeader(`${db.addon.name} (${configVars.join(', ')})`)
      hux.styledObject(
        // eslint-disable-next-line unicorn/no-array-reduce
        redis.info.reduce((memo: Record<string, unknown>, row) => {
          memo[row.name] = row.values
          return memo
        }, {}),
        redis.info.map(row => row.name),
      )
    }
  }
}
