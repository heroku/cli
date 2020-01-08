import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

export default class DomainsUpdate extends Command {
  static description = 'update a domain to use a different SSL certificate on an app'

  static examples = ['heroku domains:update www.example.com --cert-id mycert']
  static hidden = true

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
    'cert-id': flags.string({required: true})
  }

  static args = [{name: 'hostname'}]

  async run() {
    const {args, flags} = this.parse(DomainsUpdate)
    const {hostname} = args
    try {
      cli.action.start(`Updating ${color.cyan(hostname)} to use ${color.cyan(flags['cert-id'])} certificate`)
      await this.heroku.patch<string>(`/apps/${flags.app}/domains/${hostname}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.allow_multiple_sni_endpoints'
        },
        body: {sni_endpoint: flags['cert-id']}
      })
    } catch (e) {
      cli.error(e)
    } finally {
      cli.action.stop()
    }
  }
}
