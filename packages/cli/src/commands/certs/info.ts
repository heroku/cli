import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import getEndpoint from '../../lib/certs/flags'
import {displayCertificateDetails} from '../../lib/certs/certificate_details'
import {SniEndpoint} from '../../lib/types/sni_endpoint'
import {Domain} from '../../lib/types/domain'

export default class Info extends Command {
  static topic = 'certs';
  static description = 'show certificate information for an SSL certificate';
  static flags = {
    name: flags.string({description: 'name to check info on'}),
    endpoint: flags.string({description: 'endpoint to check info on'}),
    'show-domains': flags.boolean({description: 'show associated domains'}),
    app: flags.app({required: true}),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Info)
    const {app} = flags
    const endpoint = await getEndpoint(flags, this.heroku)
    ux.action.start(`Fetching SSL certificate ${endpoint.name} info for ${color.app(app)}`)
    // This is silly, we just fetched all SNI Endpoints and filtered to get the one we want just
    // to use the name on the start action message, but then we re-fetch the exact same SNI Endpoint we
    // already have.
    const {body: cert} = await this.heroku.get<SniEndpoint>(`/apps/${app}/sni-endpoints/${endpoint.name}`)
    ux.action.stop()

    if (flags['show-domains']) {
      ux.action.start(`Fetching domains for ${endpoint.name}`)
      const domains = await Promise.all(endpoint.domains.map(async domain => {
        const {body: response} = await this.heroku.get<Domain>(`/apps/${app}/domains/${domain}`)
        return response.hostname
      }))
      ux.action.stop()
      cert.domains = domains
    } else {
      cert.domains = []
    }

    displayCertificateDetails(cert)
  }
}
