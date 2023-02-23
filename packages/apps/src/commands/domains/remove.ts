import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import Spinner from '@oclif/core/lib/cli-ux/action/spinner'

export default class DomainsRemove extends Command {
  static description = 'remove a domain from an app'

  static examples = ['heroku domains:remove www.example.com']

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = [{name: 'hostname', required: true}]

  async run() {
    const {args, flags} = await this.parse(DomainsRemove)
    const action = new Spinner()

    action.start(`Removing ${color.green(args.hostname)} from ${color.app(flags.app)}`)
    await this.heroku.delete(`/apps/${flags.app}/domains/${args.hostname}`)
    action.stop()
  }
}
