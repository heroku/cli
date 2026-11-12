import type {SniEndpoint} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'

import formatTable from '../../lib/certs/format-table.js'
import {createSDK} from '../../lib/sdk.js'
import {SniEndpoint as LocalSniEndpoint} from '../../lib/types/sni-endpoint.js'

export default class Index extends Command {
  static description = 'list SSL certificates for an app'
  static enableJsonFlag = true
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'certs'

  public async run(): Promise<SniEndpoint[]> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(Index)
    const certs = await platform.sniEndpoint.list(flags.app)

    if (certs.length === 0) {
      this.log(`${color.app(flags.app)} has no SSL certificates.\nUse ${color.code('heroku certs:add CRT KEY')} to add one.`)
    } else {
      // The table is sorted by name; --json keeps the API order.
      const sortedCerts = [...certs].sort((a, b) => a.name > b.name ? 1 : (b.name > a.name ? -1 : 0))
      this.log(formatTable(sortedCerts as LocalSniEndpoint[]))
    }

    return certs
  }
}
