import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

export default class DomainsUpdate extends Command {
  static args = {
    hostname: Args.string({description: 'unique identifier of the domain or full hostname', required: true}),
  }

  static description = 'update a domain to use a different SSL certificate on an app'

  static examples = [`${color.command('heroku domains:update www.example.com --cert mycert')}`]

  static flags = {
    app: flags.app({required: true}),
    cert: flags.string({
      description: 'the name or id of the certificate you want to use for this domain',
      required: true,
    }),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DomainsUpdate)
    const {hostname} = args

    try {
      ux.action.start(`Updating ${color.name(hostname)} to use ${color.name(flags.cert)} certificate`)
      await this.heroku.patch<string>(`/apps/${flags.app}/domains/${hostname}`, {
        body: {sni_endpoint: flags.cert},
      })
    } catch (error: any) {
      ux.error(error)
    } finally {
      ux.action.stop()
    }
  }
}
