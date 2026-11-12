import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {SniEndpoint} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'

import {formatCertificateDetails} from '../../lib/certs/certificate-details.js'
import getEndpoint from '../../lib/certs/flags.js'
import {createSDK} from '../../lib/sdk.js'
import {SniEndpoint as LocalSniEndpoint} from '../../lib/types/sni-endpoint.js'

/** With --show-domains, the hostname of each entry in `domains`, in the same order. */
type SniEndpointWithHostnames = SniEndpoint & {domain_hostnames: string[]}

export default class Info extends Command {
  static description = 'show certificate information for an SSL certificate'
  static enableJsonFlag = true
  static flags = {
    app: flags.app({required: true}),
    endpoint: flags.string({description: 'endpoint to check info on'}),
    name: flags.string({description: 'name to check info on'}),
    remote: flags.remote(),
    'show-domains': flags.boolean({description: 'show associated domains'}),
  }
  static topic = 'certs'

  public async run(): Promise<SniEndpoint | SniEndpointWithHostnames> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(Info)
    const {app} = flags
    const endpoint = await getEndpoint(flags, platform)
    ux.action.start(`Fetching SSL certificate ${endpoint.name} info for ${color.app(app)}`)
    // This is silly, we just fetched all SNI Endpoints and filtered to get the one we want just
    // to use the name on the start action message, but then we re-fetch the exact same SNI Endpoint we
    // already have.
    let cert: SniEndpoint
    try {
      cert = await platform.sniEndpoint.info(app, endpoint.name)
    } catch (error) {
      // Under --json, oclif's catch() leaves the spinner running and it swallows the error output.
      ux.action.stop(color.failure('!'))
      throw error
    }

    ux.action.stop()

    let hostnames: string[] | undefined
    if (flags['show-domains']) {
      ux.action.start(`Fetching domains for ${endpoint.name}`)
      try {
        hostnames = await Promise.all(cert.domains.map(async domain => {
          const response = await platform.domain.info(app, domain)
          return response.hostname
        }))
      } catch (error) {
        ux.action.stop(color.failure('!'))
        throw error
      }

      ux.action.stop()
    }

    // The human view shows hostnames in place of the domain IDs, and no domains without --show-domains.
    this.log(formatCertificateDetails({...cert, domains: hostnames ?? []} as LocalSniEndpoint))
    return hostnames ? {...cert, domain_hostnames: hostnames} : cert
  }
}
