import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import apiFactory from '../../lib/redis/api.js'

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
    const api = apiFactory(flags.app, args.database, false, this.heroku)
    const {body: addonsList} = await this.heroku.get<Required<Heroku.AddOn>[]>(`/apps/${flags.app}/addons`)
    const addon = await api.getRedisAddon(addonsList)
    const redisFilter = api.makeAddonsFilter('REDIS_URL')
    const redis = redisFilter(addonsList) as Required<Heroku.AddOn>[]
    if (redis.length === 1 && redis[0].config_vars.filter((c: string) => c.endsWith('_URL')).length === 1) {
      const attachment = redis[0]
      await this.heroku.post('/addon-attachments', {
        body: {
          addon: {name: attachment.name}, app: {name: flags.app}, confirm: flags.app,
        },
      })
    }

    ux.stdout(`Promoting ${addon.name} to REDIS_URL on ${flags.app}`)
    await this.heroku.post('/addon-attachments', {
      body: {
        addon: {name: addon.name}, app: {name: flags.app}, confirm: flags.app, name: 'REDIS',
      },
    })
  }
}

