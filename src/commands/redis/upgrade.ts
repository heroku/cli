import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirmCommand.js'
import redisApi, {RedisApiResponse} from '../../lib/redis/api.js'

const heredoc = tsheredoc.default

export default class Upgrade extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.'}),
  }

  static description = 'perform in-place version upgrade'

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
    version: flags.string({char: 'v', required: true}),
  }

  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Upgrade)
    const {app, confirm, version} = flags
    const {database} = args
    const addon = await redisApi(app, database, false, this.heroku).getRedisAddon()
    const warning = heredoc(`
      WARNING: Irreversible action.
      Redis database will be upgraded to ${color.code(version)}. This cannot be undone.
    `)

    const confirmCommand = new ConfirmCommand()
    await confirmCommand.confirm(app, confirm, warning)

    ux.action.start(`Requesting upgrade of ${color.addon(addon.name || '')} to ${version}`)
    const {body: response} = await redisApi(app, database, false, this.heroku)
      .request<RedisApiResponse>(`/redis/v0/databases/${addon.id}/upgrade`, 'POST', {version})
    ux.action.stop(response.message)
  }
}
