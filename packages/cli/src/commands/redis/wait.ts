import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import redisApi, {RedisFormationWaitResponse} from '../../lib/redis/api'
import {HTTPError} from 'http-call'

const wait = (ms: number) => new Promise(resolve => {
  setTimeout(resolve, ms)
})

export default class Wait extends Command {
  static topic = 'redis';
  static description = 'wait for Redis instance to be available';
  static flags = {
    'wait-interval': flags.string({description: 'how frequently to poll in seconds'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({required: false}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Wait)
    const {app, 'wait-interval': waitInterval} = flags
    const {database} = args
    const api = redisApi(app, database, false, this.heroku)
    const addon = await api.getRedisAddon()

    const waitFor = async () => {
      let interval = waitInterval && Number.parseInt(waitInterval, 10)
      if (!interval || interval < 0)
        interval = 5
      let status: RedisFormationWaitResponse
      let waiting = false
      while (true) {
        try {
          // eslint-disable-next-line no-await-in-loop
          status = await api.request<RedisFormationWaitResponse>(`/redis/v0/databases/${addon.name}/wait`, 'GET').then(response => response.body)
        } catch (error) {
          const httpError = error as HTTPError
          if (httpError.statusCode !== 404)
            throw httpError
          status = {message: 'not found', 'waiting?': true}
        }

        if (!status['waiting?']) {
          if (waiting) {
            ux.action.stop(status.message)
          }

          return
        }

        if (!waiting) {
          waiting = true
          ux.action.start(`Waiting for database ${color.yellow(addon.name)}`)
        }

        ux.log(status.message)

        // eslint-disable-next-line no-await-in-loop
        await wait(interval * 1000)
      }
    }

    await waitFor()
  }
}
