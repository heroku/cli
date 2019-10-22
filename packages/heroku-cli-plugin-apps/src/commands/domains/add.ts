import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'
import * as shellescape from 'shell-escape'

import waitForDomain from '../../lib/wait-for-domain'

export default class DomainsAdd extends Command {
  static description = 'add a domain to an app'

  static examples = ['heroku domains:add www.example.com']

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    json: flags.string({description: 'output in json format', char: 'j'}),
    wait: flags.boolean()
  }

  static args = [{name: 'hostname'}]

  async run() {
    const {args, flags} = this.parse(DomainsAdd)
    const {hostname} = args
    cli.action.start(`Adding ${color.green(args.hostname)} to ${color.app(flags.app)}`)
    const {body: domain} = await this.heroku.post<Heroku.Domain>(`/apps/${flags.app}/domains`, {
      body: {hostname}
    })
    cli.action.stop()
    if (flags.json) {
      cli.styledJSON(domain)
    } else {
      cli.log(`Configure your app's DNS provider to point to the DNS Target ${color.green(domain.cname || '')}.
For help, see https://devcenter.heroku.com/articles/custom-domains`)
      if (domain.status !== 'none') {
        if (flags.wait) {
          await waitForDomain(flags.app, this.heroku, domain)
        } else {
          cli.log('')
          cli.log(`The domain ${color.green(hostname)} has been enqueued for addition`)
          let command = `heroku domains:wait ${shellescape([hostname])}`
          cli.log(`Run ${color.cmd(command)} to wait for completion`)
        }
      }
    }
  }
}
