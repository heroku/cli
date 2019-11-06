import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import waitForDomain from '../../lib/wait-for-domain'

export default class DomainsWait extends Command {
  static description = 'wait for domain to be active for an app'

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
  }

  static args = [{name: 'hostname'}]

  async run() {
    const {args, flags} = this.parse(DomainsWait)

    let domains
    if (args.hostname) {
      let {body: domain} = await this.heroku.get<Heroku.Domain>(`/apps/${flags.app}/domains/${args.hostname}`)
      domains = [domain]
    } else {
      let {body: apiDomains} = await this.heroku.get<Array<Heroku.Domain>>(`/apps/${flags.app}/domains`)
      domains = apiDomains.filter(domain => domain.status === 'pending')
    }

    for (let domain of domains) {
      await waitForDomain(flags.app, this.heroku, domain)
    }
  }
}
