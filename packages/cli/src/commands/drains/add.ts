import {Args, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags, Command} from '@heroku-cli/command'

export default class Add extends Command {
  static description = 'adds a log drain to an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    url: Args.string({required: true}),
  }

  async run() {
    const {flags, args} = await this.parse(Add)

    const {body: drain} = await this.heroku.post<Heroku.LogDrain>(`/apps/${flags.app}/log-drains`, {
      body: {url: args.url},
    })
    ux.log(`Successfully added drain ${color.cyan(drain.url || '')}`)
  }
}

