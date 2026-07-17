import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

import displayTable from '../../lib/certs/display-table.js'
import {SniEndpoint} from '../../lib/types/sni-endpoint.js'

export default class Index extends Command {
  static description = 'list SSL certificates for an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'certs'

  public async run() {
    const {platform} = new HerokuSDK()
    const {flags} = await this.parse(Index)
    const certs = await platform.sniEndpoint.list(flags.app)
    const sortedCerts = certs.sort((a, b) => a.name > b.name ? 1 : (b.name > a.name ? -1 : 0))

    if (sortedCerts.length === 0) {
      ux.stdout(`${color.app(flags.app)} has no SSL certificates.\nUse ${color.code('heroku certs:add CRT KEY')} to add one.`)
    } else {
      displayTable(sortedCerts as SniEndpoint[])
    }

    return sortedCerts
  }
}
