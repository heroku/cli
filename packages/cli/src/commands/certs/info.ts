import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import getEndpoint from '../../lib/certs/flags'
import * as CertificateDetails from '../../lib/certs/certificate_details'

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
    const endpoint = await getEndpoint(flags, this.heroku)
    ux.action.start(`Fetching SSL certificate ${endpoint.name} info for ${color.app(flags.app)}`)
    const {body: cert}: {body: CertificateDetails.cert} = await this.heroku.get(endpoint._meta.path, {headers: {Accept: 'application/vnd.heroku+json; version=3'}})
    ux.action.stop()

    if (flags['show-domains']) {
      ux.action.start(`Fetching domains for ${endpoint.name}`)
      const domains = await Promise.all(endpoint.domains.map((domain: string) => {
        return this.heroku.get<Heroku.Domain>(`/apps/${flags.app}/domains/${domain}`)
          .then(({body: response}) => response.hostname)
      }))
      ux.action.stop()
      cert.domains = domains
    } else {
      delete cert.domains
    }

    CertificateDetails.getCertificateDetails(cert)
  }
}
