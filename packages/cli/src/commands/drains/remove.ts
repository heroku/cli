import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Remove extends Command {
  static description = 'removes a log drain from an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static example = 'drains:remove [URL|TOKEN]'

  static args = {
    url: Args.string({required: true}),
  }

  async run() {
    const {flags, args} = await this.parse(Remove)

    const {body: drain} = await this.heroku.delete<Heroku.LogDrain>(`/apps/${flags.app}/log-drains/${encodeURIComponent(args.url)}`)
    ux.log(`Successfully removed drain ${color.cyan(drain.url || '')}`)
  }
}

