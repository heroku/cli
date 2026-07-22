import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {redisExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirm-command.js'

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

    const {data} = new HerokuSDK({extensions: [redisExtensions]})
    const addon = await data.redis.resolveByApp(app, {database})
    const warning = heredoc(`
      WARNING: Irreversible action.
      Redis database will be upgraded to ${color.code(version)}. This cannot be undone.
    `)

    const confirmCommand = new ConfirmCommand()
    await confirmCommand.confirm(app, confirm, warning)

    ux.action.start(`Requesting upgrade of ${color.addon(addon.name || '')} to ${version}`)
    const response = await data.redis.upgrade(addon.id!, {version})
    ux.action.stop(response.message)
  }
}
