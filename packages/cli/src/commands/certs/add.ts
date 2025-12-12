import {color} from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {waitForDomains} from '../../lib/certs/domains.js'
import inquirer from 'inquirer'
import {CertAndKeyManager} from '../../lib/certs/get_cert_and_key.js'
import tsheredoc from 'tsheredoc'
import {SniEndpoint} from '../../lib/types/sni_endpoint.js'
import {displayCertificateDetails} from '../../lib/certs/certificate_details.js'

const heredoc = tsheredoc.default

export default class Add extends Command {
  static topic = 'certs'
  static strict = true
  static description = `Add an SSL certificate to an app.

  Note: certificates with PEM encoding are also valid.
  `
  static examples = [
    heredoc(`$ heroku certs:add example.com.crt example.com.key
    If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
    https://help.salesforce.com/s/articleView?id=000333504&type=1`),
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    CRT: Args.string({required: true, description: 'absolute path of the certificate file on disk'}),
    KEY: Args.string({required: true, description: 'absolute path of the key file on disk'}),
  }

  getDomainsToAssociate(sniEndpoint: SniEndpoint) {
    return inquirer.prompt<{domains: string[]}>([{
      type: 'checkbox',
      name: 'domains',
      message: 'Select domains',
      choices: sniEndpoint.ssl_cert.cert_domains,
    }])
  }

  async configureDomains(app: string, heroku: APIClient, cert: SniEndpoint) {
    const certDomains = cert.ssl_cert.cert_domains
    const apiDomains = await waitForDomains(app, heroku)
    const appDomains = apiDomains?.map((domain: Heroku.Domain) => domain.hostname as string)
    const matchedDomains = matchDomains(certDomains, appDomains ?? [])
    if (matchedDomains.length > 0) {
      hux.styledHeader('Almost done! Which of these domains on this application would you like this certificate associated with?')
      const selections = await this.selectDomains(matchedDomains)
      await Promise.all(selections?.domains.map(domain => heroku.patch(`/apps/${app}/domains/${domain}`, {
        body: {sni_endpoint: cert.name},
      })))
    }
  }

  async selectDomains(domainOptions: string[]) {
    return inquirer.prompt<{domains: string[]}>([{
      type: 'checkbox',
      name: 'domains',
      message: 'Select domains',
      choices: domainOptions,
    }])
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Add)
    const {app} = flags
    const certManager = new CertAndKeyManager()
    const files = await certManager.getCertAndKey(args)
    ux.action.start(`Adding SSL certificate to ${color.magenta(app)}`)
    const {body: sniEndpoint} = await this.heroku.post<SniEndpoint>(`/apps/${app}/sni-endpoints`, {
      body: {
        certificate_chain: files.crt.toString(),
        private_key: files.key.toString(),
      },
    })
    ux.action.stop()

    displayCertificateDetails(sniEndpoint)
    await this.configureDomains(app, this.heroku, sniEndpoint)
  }
}

function splitDomains(domains: string[]): [string, string][] {
  return domains.map(domain => [domain.slice(0, 1), domain.slice(1)])
}

function createMatcherFromSplitDomain([firstChar, rest]: [string, string]) {
  const matcherContents = []
  if (firstChar === '*') {
    matcherContents.push('^[\\w\\-]+')
  } else {
    matcherContents.push(firstChar)
  }

  const escapedRest = rest.replace(/\./g, '\\.')

  matcherContents.push(escapedRest)

  return new RegExp(matcherContents.join(''))
}

function matchDomains(certDomains: string[], appDomains: string[]) {
  const splitCertDomains = splitDomains(certDomains)
  const matchers = splitCertDomains.map(splitDomain => createMatcherFromSplitDomain(splitDomain))

  if (splitCertDomains.some(domain => (domain[0] === '*'))) {
    const matchedDomains: string[] = []
    appDomains.forEach(appDomain => {
      if (matchers.some(matcher => matcher.test(appDomain))) {
        matchedDomains.push(appDomain)
      }
    })

    return matchedDomains
  }

  return certDomains.filter(domain => appDomains.includes(domain))
}
