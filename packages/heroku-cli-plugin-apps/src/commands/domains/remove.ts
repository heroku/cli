import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

export default class DomainsRemove extends Command {
  static description = 'remove a domain from an app'

  static examples = ['heroku domains:remove www.example.com']

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
  }

  static args = [{name: 'hostname'}]

  async run() {
    const {args, flags} = this.parse(DomainsRemove)
    cli.action.start(`Removing ${color.green(args.hostname)} from ${color.app(flags.app)}`)
    await this.heroku.delete(`/apps/${flags.app}/domains/${args.hostname}`)
    cli.action.stop()
  }
}
