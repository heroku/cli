import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {sniEndpointExtensions, type SniEndpointWithDomainHostnames} from '@heroku/sdk/extensions/platform'
import {SniEndpoint} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'

import {formatCertificateDetails} from '../../lib/certs/certificate-details.js'
import {sniEndpointSelector, withSelectorFlagHint} from '../../lib/certs/flags.js'
import {createSDK} from '../../lib/sdk.js'
import {SniEndpoint as LocalSniEndpoint} from '../../lib/types/sni-endpoint.js'

export default class Info extends Command {
  static description = 'show certificate information for an SSL certificate'
  static enableJsonFlag = true
  static flags = {
    app: flags.app({required: true}),
    endpoint: flags.string({description: 'endpoint to check info on', exclusive: ['name']}),
    name: flags.string({description: 'name to check info on', exclusive: ['endpoint']}),
    remote: flags.remote(),
    'show-domains': flags.boolean({description: 'show associated domains'}),
  }
  static topic = 'certs'

  public async run(): Promise<SniEndpoint | SniEndpointWithDomainHostnames> {
    const {platform} = createSDK(this.heroku, {extensions: [sniEndpointExtensions]})
    const {flags} = await this.parse(Info)
    const {app} = flags
    const selector = sniEndpointSelector(flags)
    // Only --name gives the certificate's name before the SDK call returns.
    ux.action.start(flags.name === undefined
      ? `Fetching SSL certificate info for ${color.app(app)}`
      : `Fetching SSL certificate ${flags.name} info for ${color.app(app)}`)
    let cert: SniEndpoint | SniEndpointWithDomainHostnames
    try {
      cert = flags['show-domains']
        ? await platform.sniEndpoint.infoByApp(app, selector, {includeDomainHostnames: true})
        : await platform.sniEndpoint.infoByApp(app, selector)
    } catch (error) {
      throw withSelectorFlagHint(error)
    }

    ux.action.stop()

    // The human view shows hostnames in place of the domain IDs, and no domains without --show-domains.
    const hostnames = 'domain_hostnames' in cert ? cert.domain_hostnames : []
    this.log(formatCertificateDetails({...cert, domains: hostnames} as LocalSniEndpoint))
    return cert
  }
}
