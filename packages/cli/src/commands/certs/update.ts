import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {displayCertificateDetails} from '../../lib/certs/certificate_details'
import {getCertAndKey} from '../../lib/certs/get_cert_and_key'
import heredoc from 'tsheredoc'
import getEndpoint from '../../lib/certs/flags'
import confirmCommand from '../../lib/confirmCommand'
import {SniEndpoint} from '../../lib/types/sni_endpoint'

export default class Update extends Command {
  static topic = 'certs';
  static description = heredoc`
    update an SSL certificate on an app
    Note: certificates with PEM encoding are also valid
  `
  static flags = {
    confirm: flags.string({hidden: true}),
    name: flags.string({description: 'name to update'}),
    endpoint: flags.string({description: 'endpoint to update'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    CRT: Args.string({required: true, description: 'absolute path of the certificate file on disk'}),
    KEY: Args.string({required: true, description: 'absolute path of the key file on disk'}),
  }

  static examples = [heredoc`
    $ heroku certs:update example.com.crt example.com.key

        If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
        https://help.salesforce.com/s/articleView?id=000333504&type=1
  `]

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Update)
    const {app, confirm} = flags
    let sniEndpoint = await getEndpoint(flags, this.heroku)
    const files = await getCertAndKey(args)

    await confirmCommand(
      app,
      confirm,
      heredoc`
        Potentially Destructive Action
        This command will change the certificate of endpoint ${sniEndpoint.name} from ${color.magenta(app)}.
      `,
    )

    ux.action.start(`Updating SSL certificate ${sniEndpoint.name} for ${color.magenta(app)}`);
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
