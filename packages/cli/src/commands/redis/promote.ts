import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import apiFactory from '../../lib/redis/api'
export default class Promote extends Command {
  static topic = 'redis'
  static description = 'sets DATABASE as your REDIS_URL'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Promote)
    const api = apiFactory(flags.app, args.database || 'REDIS_URL', false, this.heroku)
    const redis = await api.getRedisAddon()
    if (redis.length === 1 && redis[0].config_vars.filter((c: string) => c.endsWith('_URL')).length === 1) {
      const attachment = redis[0]
      await this.heroku.post('/addon-attachments', {
        body: {
          app: {name: flags.app}, addon: {name: attachment.name}, confirm: flags.app,
        },
      })
    }

    ux.log(`Promoting ${redis.name} to REDIS_URL on ${flags.app}`)
    await this.heroku.post('/addon-attachments', {
      body: {
        app: {name: flags.app}, addon: {name: redis.name}, confirm: flags.app, name: 'REDIS',
      },
    })
  }
}
