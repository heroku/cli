import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

export default class DomainsUpdate extends Command {
  static description = 'update a domain to use a different SSL certificate on an app'

  static examples = ['heroku domains:update www.example.com --cert mycert']

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    cert: flags.string({
      required: true,
      description: 'the name or id of the certificate you want to use for this domain',
    }),
  }

  static args = {
    hostname: Args.string({required: true, description: 'unique identifier of the domain or full hostname'}),
  }

  async run() {
    const {args, flags} = await this.parse(DomainsUpdate)
    const {hostname} = args

    try {
      ux.action.start(`Updating ${color.cyan(hostname)} to use ${color.cyan(flags.cert)} certificate`)
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
