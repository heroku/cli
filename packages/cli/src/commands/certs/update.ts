import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {displayCertificateDetails} from '../../lib/certs/certificate_details.js'
import getEndpoint from '../../lib/certs/flags.js'
import {CertAndKeyManager} from '../../lib/certs/get_cert_and_key.js'
import ConfirmCommand from '../../lib/confirmCommand.js'
import {SniEndpoint} from '../../lib/types/sni_endpoint.js'

const heredoc = tsheredoc.default

export default class Update extends Command {
  static args = {
    CRT: Args.string({description: 'absolute path of the certificate file on disk', required: true}),
    KEY: Args.string({description: 'absolute path of the key file on disk', required: true}),
  }

  static description = heredoc`
    update an SSL certificate on an app
    Note: certificates with PEM encoding are also valid
  `
  static examples = [heredoc`
    $ heroku certs:update example.com.crt example.com.key

        If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
        https://help.salesforce.com/s/articleView?id=000333504&type=1
  `]

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({hidden: true}),
    endpoint: flags.string({description: 'endpoint to update'}),
    name: flags.string({description: 'name to update'}),
    remote: flags.remote(),
  }

  static topic = 'certs'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Update)
    const {app, confirm} = flags
    let sniEndpoint = await getEndpoint(flags, this.heroku)
    const files = await new CertAndKeyManager().getCertAndKey(args)

    await new ConfirmCommand().confirm(
      app,
      confirm,
      heredoc`
        Potentially Destructive Action
        This command will change the certificate of endpoint ${sniEndpoint.name} from ${color.app(app)}.
      `,
    )

    ux.action.start(`Updating SSL certificate ${sniEndpoint.name} for ${color.app(app)}`);
    ({body: sniEndpoint} = await this.heroku.patch<SniEndpoint>(`/apps/${app}/sni-endpoints/${sniEndpoint.name}`, {
      body: {
        certificate_chain: files.crt,
        private_key: files.key,
      },
    }))
    ux.action.stop()

    displayCertificateDetails(sniEndpoint, 'Updated certificate details:')
  }
}
