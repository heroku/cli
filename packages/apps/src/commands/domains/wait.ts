import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import waitForDomain from '../../lib/wait-for-domain'

export default class DomainsWait extends Command {
  static description = 'wait for domain to be active for an app'

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = [{name: 'hostname'}]

  async run() {
    const {args, flags} = this.parse(DomainsWait)

    let domains
    if (args.hostname) {
      const {body: domain} = await this.heroku.get<Heroku.Domain>(`/apps/${flags.app}/domains/${args.hostname}`)
      domains = [domain]
    } else {
      const {body: apiDomains} = await this.heroku.get<Array<Heroku.Domain>>(`/apps/${flags.app}/domains`)
      domains = apiDomains.filter(domain => domain.status === 'pending')
    }

    for (const domain of domains) {
      // eslint-disable-next-line no-await-in-loop
      await waitForDomain(flags.app, this.heroku, domain)
    }
  }
}
