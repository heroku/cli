import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class Add extends Command {
  static args = {
    url: Args.string({description: 'URL of the log drain', required: true}),
  }

  static description = 'adds a log drain to an app'

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(Add)

    const {body: drain} = await this.heroku.post<Heroku.LogDrain>(`/apps/${flags.app}/log-drains`, {
      body: {url: args.url},
    })
    ux.stdout(`Successfully added drain ${color.name(drain.url || '')}`)
  }
}
