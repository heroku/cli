import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {redisExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirm-command.js'

const heredoc = tsheredoc.default

export default class StatsReset extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.'}),
  }
  static description = 'reset all stats covered by RESETSTAT (https://redis.io/commands/config-resetstat)'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  }
  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(StatsReset)
    const {app, confirm} = flags
    const {database} = args

    const {data} = new HerokuSDK({extensions: [redisExtensions]})
    const addon = await data.redis.resolveByApp(app, {database})
    const warning = heredoc(`
      WARNING: Irreversible action.
      All stats covered by RESETSTAT will be reset on ${color.addon(addon.name || '')}.`)

    const confirmCommand = new ConfirmCommand()
    await confirmCommand.confirm(app, confirm, warning)

    ux.action.start(`Resetting stats on ${color.addon(addon.name || '')}`)
    const response = await data.redis.resetStats(addon.id!)
    ux.action.stop(response.message)
  }
}
