import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class DomainsClear extends Command {
  static description = 'remove all domains from an app'

  static examples = ['heroku domains:clear']

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {flags} = this.parse(DomainsClear)
    cli.action.start(`Removing all domains from ${color.app(flags.app)}`)
    let {body: domains} = await this.heroku.get<Array<Heroku.Domain>>(`/apps/${flags.app}/domains`)
    domains = domains.filter((d: Heroku.Domain) => d.kind === 'custom')
    for (const domain of domains) {
      // eslint-disable-next-line no-await-in-loop
      await this.heroku.delete(`/apps/${flags.app}/domains/${domain.hostname}`)
    }
    cli.action.stop()
  }
}
