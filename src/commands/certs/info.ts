import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {SniEndpoint} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'

import {displayCertificateDetails} from '../../lib/certs/certificate-details.js'
import getEndpoint from '../../lib/certs/flags.js'
import {SniEndpoint as LocalSniEndpoint} from '../../lib/types/sni-endpoint.js'

export default class Info extends Command {
  static description = 'show certificate information for an SSL certificate'
  static flags = {
    app: flags.app({required: true}),
    endpoint: flags.string({description: 'endpoint to check info on'}),
    name: flags.string({description: 'name to check info on'}),
    remote: flags.remote(),
    'show-domains': flags.boolean({description: 'show associated domains'}),
  }
  static topic = 'certs'

  public async run(): Promise<SniEndpoint> {
    const {platform} = new HerokuSDK()
    const {flags} = await this.parse(Info)
    const {app} = flags
    const endpoint = await getEndpoint(flags, platform)
    ux.action.start(`Fetching SSL certificate ${endpoint.name} info for ${color.app(app)}`)
    // This is silly, we just fetched all SNI Endpoints and filtered to get the one we want just
    // to use the name on the start action message, but then we re-fetch the exact same SNI Endpoint we
    // already have.
    const cert = await platform.sniEndpoint.info(app, endpoint.name)
    ux.action.stop()

    if (flags['show-domains']) {
      ux.action.start(`Fetching domains for ${endpoint.name}`)
      const domains = await Promise.all(endpoint.domains.map(async domain => {
        const response = await platform.domain.info(app, domain)
        return response.hostname
      }))
      ux.action.stop()
      cert.domains = domains
    } else {
      cert.domains = []
    }

    displayCertificateDetails(cert as LocalSniEndpoint)
    return cert
  }
}
