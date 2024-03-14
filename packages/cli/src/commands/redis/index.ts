import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import redisApi from '../../lib/redis/info'

export default class Index extends Command {
  static topic = 'redis'
  static description = 'gets information about redis'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  static args = {
    database: Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Index)
    const {app, json} = flags
    const {database} = args
    return redisApi(app, database, json, this.heroku).info()
  }
}
