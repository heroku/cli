import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {sniEndpointExtensions} from '@heroku/sdk/extensions/platform'
import {SniEndpoint} from '@heroku/types/3.sdk'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {formatCertificateDetails} from '../../lib/certs/certificate-details.js'
import {sniEndpointSelector, withSelectorFlagHint} from '../../lib/certs/flags.js'
import {CertAndKeyManager} from '../../lib/certs/get-cert-and-key.js'
import ConfirmCommand from '../../lib/confirm-command.js'
import {createSDK} from '../../lib/sdk.js'
import {SniEndpoint as LocalSniEndpoint} from '../../lib/types/sni-endpoint.js'

const heredoc = tsheredoc

export default class Update extends Command {
  static args = {
    CRT: Args.string({description: 'absolute path of the certificate file on disk', required: true}),
    KEY: Args.string({description: 'absolute path of the key file on disk', required: true}),
  }
  static description = heredoc`
    update an SSL certificate on an app
    Note: certificates with PEM encoding are also valid
  `
  static enableJsonFlag = true
  static examples = [heredoc`
    ${color.command('heroku certs:update example.com.crt example.com.key')}

        If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
        https://help.salesforce.com/s/articleView?id=000333504&type=1
  `]
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({description: 'set to app name to bypass confirm prompt'}),
    endpoint: flags.string({description: 'endpoint to update', exclusive: ['name']}),
    name: flags.string({description: 'name to update', exclusive: ['endpoint']}),
    remote: flags.remote(),
  }
  static topic = 'certs'

  public async run(): Promise<SniEndpoint> {
    const {platform} = createSDK(this.heroku, {extensions: [sniEndpointExtensions]})
    const {args, flags} = await this.parse(Update)
    const {app, confirm} = flags
    const files = await new CertAndKeyManager().getCertAndKey(args)

    let updating = false
    let sniEndpoint: SniEndpoint
    try {
      sniEndpoint = await platform.sniEndpoint.resolveAndUpdate(app, sniEndpointSelector(flags), {
        certificate_chain: files.crt,
        private_key: files.key,
      }, {
        beforeUpdate: async current => {
          await new ConfirmCommand().confirm(
            app,
            confirm,
            heredoc`
              Potentially Destructive Action
              This command will change the certificate of endpoint ${current.name} from ${color.app(app)}.
            `,
            {json: this.jsonEnabled()},
          )
          ux.action.start(`Updating SSL certificate ${current.name} for ${color.app(app)}`)
          updating = true
        },
      })
    } catch (error) {
      // Under --json, oclif's catch() leaves the spinner running and it swallows the error output.
      if (updating) ux.action.stop(color.failure('!'))
      throw withSelectorFlagHint(error)
    }

    ux.action.stop()

    this.log(formatCertificateDetails(sniEndpoint as LocalSniEndpoint, 'Updated certificate details:'))

    return sniEndpoint
  }
}
