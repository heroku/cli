import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

export default class DomainsUpdate extends Command {
  static description = 'update a domain to use a different SSL certificate on an app'

  static examples = ['heroku domains:update www.example.com --cert mycert']

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
    cert: flags.string({
      required: true,
      description: 'the name or id of the certificate you want to use for this domain',
    }),
  }

  static args = [{name: 'hostname'}]

  async run() {
    const {args, flags} = this.parse(DomainsUpdate)
    const {hostname} = args
    try {
      cli.action.start(`Updating ${color.cyan(hostname)} to use ${color.cyan(flags.cert)} certificate`)
      await this.heroku.patch<string>(`/apps/${flags.app}/domains/${hostname}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.allow_multiple_sni_endpoints',
        },
        body: {sni_endpoint: flags.cert},
      })
    } catch (error) {
      cli.error(error)
    } finally {
      cli.action.stop()
    }
  }
}
