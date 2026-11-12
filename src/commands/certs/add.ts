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

/** `--domains` as a list: undefined when the flag isn't passed, `[]` for `--domains ''`. */
function parseDomains(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined
  return value.split(',').map(hostname => hostname.trim()).filter(Boolean)
}

/**
 * Name the CLI flags for SDK errors that can't: `--domains` when the certificate covers app
 * domains but none were chosen (--json), and how to remove a certificate that was uploaded but
 * couldn't be associated. Checked by name, not `instanceof`, so it doesn't depend on which copy
 * of the SDK threw.
 */
function withFlagHints(error: unknown, app: string): unknown {
  if (!(error instanceof Error)) return error

  if (error.name === 'CertificateDomainsRequiredError') {
    const {matches} = error as Error & {matches: string[]}
    const pass = 'Pass --domains with the hostnames to associate, or --domains \'\' to associate none.'
    return new Error(`This certificate covers ${matches.join(', ')} on ${app}. ${pass} Commands don't prompt for domains with --json. Nothing was uploaded.`, {cause: error})
  }

  if (error.name === 'SniEndpointAssociationError') {
    const {sniEndpoint} = error as Error & {sniEndpoint: {name: string}}
    return new Error(`${error.message}\nTo remove it, run heroku certs:remove --app ${app} --name ${sniEndpoint.name}.`, {cause: error})
  }

  return error
}

export default class Add extends Command {
  static args = {
    CRT: Args.string({description: 'absolute path of the certificate file on disk', required: true}),
    KEY: Args.string({description: 'absolute path of the key file on disk', required: true}),
  }
  static description = `Add an SSL certificate to an app.

  Note: certificates with PEM encoding are also valid.
  Without --domains, prompts for which of the app's domains the certificate covers to associate it with.
  With --json, pass --domains when the certificate covers any of the app's domains.
  `
  static enableJsonFlag = true
  static examples = [heredoc(`
    ${color.command('heroku certs:add example.com.crt example.com.key')}
    If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
    ${color.info('https://help.salesforce.com/s/articleView?id=000333504&type=1')}`),
  heredoc(`
    Associate the certificate with specific domains without prompting:
    ${color.command('heroku certs:add example.com.crt example.com.key --domains www.example.com,api.example.com')}`)]
  static flags = {
    app: flags.app({required: true}),
    domains: flags.string({description: 'comma-separated hostnames to associate the certificate with, instead of prompting; pass \'\' to associate none'}),
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

    const certificate = {certificateChain: files.crt.toString(), privateKey: files.key.toString()}
    const domains = parseDomains(flags.domains)

    const domainPoller = {
      onStart() {
        // Stop the current spinner
        ux.action.stop()
        // Start a new spinner
        ux.action.start('Waiting for stable domains to be created')
      },
      onStop: () => ux.action.stop(),
    }

    ux.action.start(`Adding SSL certificate to ${color.app(app)}`)
    let sniEndpoint: SniEndpoint
    try {
      sniEndpoint = await platform.sniEndpoint.createAndAssociate(app, certificate, this.associateOptions(domains, domainPoller, inquirer)) as SniEndpoint
      ux.action.stop()
    } catch (error) {
      // Stop with a failure marker instead of the default 'done' so a failed
      // create/wait doesn't print a success spinner right before the error.
      // No-op if chooseDomains already stopped the spinner.
      ux.action.stop(color.failure('!'))
      throw withFlagHints(error, app)
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

  /**
   * `--domains` as given; otherwise a prompt, except under --json, which never prompts: the SDK
   * then uploads only if the certificate covers none of the app's domains.
   */
  private associateOptions(domains: string[] | undefined, domainPoller: {onStart(): void; onStop(): void}, inquirer: any) {
    if (domains !== undefined) return {domainPoller, domains}
    if (this.jsonEnabled()) return {domainPoller}
    return {
      chooseDomains: async (candidates: string[]) => {
        ux.action.stop()
        this.log(hux.styledHeader('Almost done! Which of these domains on this application would you like this certificate associated with?'))
        const {domains: selected} = await this.selectDomains(candidates, inquirer)
        return selected
      },
      domainPoller,
    }
  }
}
