import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class Remove extends Command {
  static args = {
    url: Args.string({description: 'URL of the log drain', required: true}),
  }

  static description = 'removes a log drain from an app'

  static example = `${color.command('drains:remove [URL|TOKEN]')}`

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(Remove)

    const {body: drain} = await this.heroku.delete<Heroku.LogDrain>(`/apps/${flags.app}/log-drains/${encodeURIComponent(args.url)}`)
    ux.stdout(`Successfully removed drain ${color.cyan(drain.url || '')}`)
  }
}
