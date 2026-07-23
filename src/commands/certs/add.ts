import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {sniEndpointExtensions} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {displayCertificateDetails} from '../../lib/certs/certificate-details.js'
import {CertAndKeyManager} from '../../lib/certs/get-cert-and-key.js'
import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {SniEndpoint} from '../../lib/types/sni-endpoint.js'

const heredoc = tsheredoc.default

export default class Add extends Command {
  static args = {
    CRT: Args.string({description: 'absolute path of the certificate file on disk', required: true}),
    KEY: Args.string({description: 'absolute path of the key file on disk', required: true}),
  }
  static description = `Add an SSL certificate to an app.

  Note: certificates with PEM encoding are also valid.
  `
  static examples = [heredoc(`
    ${color.command('heroku certs:add example.com.crt example.com.key')}
    If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
    ${color.info('https://help.salesforce.com/s/articleView?id=000333504&type=1')}`)]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static strict = true
  static topic = 'certs'

  public async run(): Promise<SniEndpoint> {
    const inquirer = await lazyModuleLoader.loadInquirer()

    const {args, flags} = await this.parse(Add)
    const {app} = flags
    const certManager = new CertAndKeyManager()
    const files = await certManager.getCertAndKey(args)
    const {platform} = new HerokuSDK({extensions: [sniEndpointExtensions]})

    ux.action.start(`Adding SSL certificate to ${color.app(app)}`)
    let sniEndpoint: SniEndpoint
    try {
      sniEndpoint = await platform.sniEndpoint.createAndAssociate(
        app,
        files.crt.toString(),
        files.key.toString(),
        {
          resolveDomains: async (candidates: string[]) => {
            ux.action.stop()
            hux.styledHeader('Almost done! Which of these domains on this application would you like this certificate associated with?')
            const {domains} = await this.selectDomains(candidates, inquirer)
            return domains
          },
        },
      ) as SniEndpoint
      ux.action.stop()
    } catch (error) {
      // Stop with a failure marker instead of the default 'done' so a failed
      // create/wait doesn't print a success spinner right before the error.
      // No-op if resolveDomains already stopped the spinner.
      ux.action.stop(color.red('!'))
      throw error
    }

    displayCertificateDetails(sniEndpoint)
    return sniEndpoint
  }

  async selectDomains(domainOptions: string[], inquirer: any) {
    return inquirer.prompt([{
      choices: domainOptions,
      message: 'Select domains',
      name: 'domains',
      type: 'checkbox',
    }])
  }
}
