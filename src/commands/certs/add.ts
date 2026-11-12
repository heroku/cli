import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {sniEndpointExtensions} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {formatCertificateDetails} from '../../lib/certs/certificate-details.js'
import {CertAndKeyManager} from '../../lib/certs/get-cert-and-key.js'
import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {createSDK} from '../../lib/sdk.js'
import {SniEndpoint} from '../../lib/types/sni-endpoint.js'

const heredoc = tsheredoc

export default class Add extends Command {
  static args = {
    CRT: Args.string({description: 'absolute path of the certificate file on disk', required: true}),
    KEY: Args.string({description: 'absolute path of the key file on disk', required: true}),
  }
  static description = `Add an SSL certificate to an app.

  Note: certificates with PEM encoding are also valid.
  With --json, the certificate isn't associated with any domains; use domains:update --cert to associate it.
  `
  static enableJsonFlag = true
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
    const {platform} = createSDK(this.heroku, {extensions: [sniEndpointExtensions]})

    ux.action.start(`Adding SSL certificate to ${color.app(app)}`)
    let sniEndpoint: SniEndpoint
    try {
      sniEndpoint = await platform.sniEndpoint.createAndAssociate(
        app,
        files.crt.toString(),
        files.key.toString(),
        {
          domainPoller: {
            onStart() {
              // Stop the current spinner
              ux.action.stop()
              // Start a new spinner
              ux.action.start('Waiting for stable domains to be created')
            },
            onStop: () => ux.action.stop(),
          },
          resolveDomains: async (candidates: string[]) => {
            ux.action.stop()
            if (this.jsonEnabled()) {
              // --json never prompts. The certificate already exists, so associate none rather than fail.
              ux.warn(`Not associating this certificate with ${candidates.join(', ')}: --json doesn't prompt for domains. To associate one, run ${color.code('heroku domains:update <hostname> --cert <name>')}.`)
              return []
            }

            this.log(hux.styledHeader('Almost done! Which of these domains on this application would you like this certificate associated with?'))
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

    this.log(formatCertificateDetails(sniEndpoint))
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
