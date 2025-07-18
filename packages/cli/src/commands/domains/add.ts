import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import inquirer from 'inquirer'
import {quote} from '../../lib/config/quote.js'
import waitForDomain from '../../lib/domains/wait-for-domain.js'

interface DomainCreatePayload {
  hostname: string;
  sni_endpoint: string | null;
}

type CertChoice = {
  name: string;
  value: string | null | undefined;
}

export default class DomainsAdd extends Command {
  static description = 'add a domain to an app'

  static examples = ['heroku domains:add www.example.com']

  static flags = {
    app: flags.app({required: true}),
    cert: flags.string({description: 'the name of the SSL cert you want to use for this domain', char: 'c'}),
    json: flags.boolean({description: 'output in json format', char: 'j'}),
    wait: flags.boolean(),
    remote: flags.remote(),
  }

  static args = {
    hostname: Args.string({required: true, description: 'unique identifier of the domain or full hostname'}),
  }

  certSelect = async (certs: Array<Heroku.SniEndpoint>) => {
    const nullCertChoice = {
      name: 'No SNI Endpoint',
      value: null,
    }

    const certChoices = certs.map((cert: Heroku.SniEndpoint) => {
      const certName = cert.displayName || cert.name
      const domainsLength = cert.ssl_cert.cert_domains.length

      if (domainsLength) {
        let domainsList = cert.ssl_cert.cert_domains.slice(0, 4).join(', ')

        if (domainsLength > 5) {
          domainsList = `${domainsList} (...and ${domainsLength - 4} more)`
        }

        domainsList = `${certName} -> ${domainsList}`

        return {
          name: domainsList,
          value: cert.name,
        }
      }

      return {
        name: certName,
        value: cert.name,
      }
    })

    return this.promptForCert(nullCertChoice, certChoices)
  }

  async promptForCert(nullCertChoice: CertChoice, certChoices: CertChoice[]) {
    const selection = await inquirer.prompt<{ cert: string }>([
      {
        type: 'list',
        name: 'cert',
        message: 'Choose an SNI endpoint to associate with this domain',
        choices: [nullCertChoice, ...certChoices],
      },
    ])

    return selection.cert
  }

  async run() {
    const {args, flags} = await this.parse(DomainsAdd)
    const {hostname} = args

    const domainCreatePayload: DomainCreatePayload = {
      hostname,
      sni_endpoint: null,
    }

    let certs: Array<Heroku.SniEndpoint> = []

    ux.action.start(`Adding ${color.green(domainCreatePayload.hostname)} to ${color.app(flags.app)}`)
    if (flags.cert) {
      domainCreatePayload.sni_endpoint = flags.cert
    } else {
      const {body} = await this.heroku.get<Array<Heroku.SniEndpoint>>(`/apps/${flags.app}/sni-endpoints`)

      certs = [...body]
    }

    if (certs.length > 1) {
      ux.action.stop('resolving SNI endpoint')
      const certSelection = await this.certSelect(certs)

      if (certSelection) {
        domainCreatePayload.sni_endpoint = certSelection
      }

      ux.action.start(`Adding ${color.green(domainCreatePayload.hostname)} to ${color.app(flags.app)}`)
    }

    try {
      const {body: domain} = await this.heroku.post<Heroku.Domain>(`/apps/${flags.app}/domains`, {
        body: domainCreatePayload,
      })

      if (flags.json) {
        hux.styledJSON(domain)
      } else {
        ux.stdout(`Configure your app's DNS provider to point to the DNS Target ${color.green(domain.cname || '')}.
    For help, see https://devcenter.heroku.com/articles/custom-domains`)
        if (domain.status !== 'none') {
          if (flags.wait) {
            await waitForDomain(flags.app, this.heroku, domain)
          } else {
            ux.stdout('')
            ux.stdout(`The domain ${color.green(hostname)} has been enqueued for addition`)
            const command = `heroku domains:wait ${quote(hostname)}`
            ux.stdout(`Run ${color.cmd(command)} to wait for completion`)
          }
        }
      }
    } catch (error: any) {
      ux.error(error)
    } finally {
      ux.action.stop()
    }
  }
}
