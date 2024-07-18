import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import displayTable from '../../lib/certs/display_table'
import {SniEndpoint} from '../../lib/types/sni_endpoint'

export default class Index extends Command {
  static topic = 'certs';
  static description = 'list SSL certificates for an app';
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {body: certs} = await this.heroku.get<SniEndpoint[]>(`/apps/${flags.app}/sni-endpoints`)

    if (certs.length === 0) {
      ux.log(`${color.magenta(flags.app)} has no SSL certificates.\nUse ${color.cmd('heroku certs:add CRT KEY')} to add one.`)
    } else {
      const sortedCerts = certs.sort((a, b) => a.name > b.name ? 1 : (b.name > a.name ? -1 : 0))
      displayTable(sortedCerts)
    }
  }
}
