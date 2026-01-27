import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

export default class DomainsRemove extends Command {
  static args = {
    hostname: Args.string({description: 'unique identifier of the domain or full hostname', required: true}),
  }

  static description = 'remove a domain from an app'

  static examples = [`${color.command('heroku domains:remove www.example.com')}`]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DomainsRemove)

    ux.action.start(`Removing ${color.green(args.hostname)} from ${color.app(flags.app)}`)
    await this.heroku.delete(`/apps/${flags.app}/domains/${args.hostname}`)
    ux.action.stop()
  }
}
