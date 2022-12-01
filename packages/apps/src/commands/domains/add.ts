import {Flags, CliUx} from '@oclif/core'
import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {prompt} from 'inquirer'
import waitForDomain from '../../lib/wait-for-domain'
const shellescape = require('shell-escape')

interface DomainCreatePayload {
  hostname: string;
  sni_endpoint: string | null;
}

export default class DomainsAdd extends Command {
  static description = 'add a domain to an app'

  static examples = ['heroku domains:add www.example.com']

  static flags = {
    help: Flags.help({char: 'h'}),
    app: flags.app({required: true}),
    cert: Flags.string({description: 'the name of the SSL cert you want to use for this domain', char: 'c'}),
    json: Flags.boolean({description: 'output in json format', char: 'j'}),
    wait: Flags.boolean(),
    remote: flags.remote(),
  }

  static args = [{name: 'hostname', required: true}]

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

    const selection = await prompt<{ cert: string }>([
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

    if (flags.app) {
      CliUx.ux.action.start(`Adding ${color.green(domainCreatePayload.hostname)} to ${color.app(flags.app)}`)
    }

    if (flags.cert) {
      domainCreatePayload.sni_endpoint = flags.cert
    } else {
      const {body} = await this.heroku.get<Array<Heroku.SniEndpoint>>(`/apps/${flags.app}/sni-endpoints`)

      certs = [...body]
    }

    if (certs.length > 1) {
      CliUx.ux.action.stop('resolving SNI endpoint')
      const certSelection = await this.certSelect(certs)

      if (certSelection) {
        domainCreatePayload.sni_endpoint = certSelection
      }

      if (flags.app) {
        CliUx.ux.action.start(`Adding ${color.green(domainCreatePayload.hostname)} to ${color.app(flags.app)}`)
      }
    }

    try {
      const {body: domain} = await this.heroku.post<Heroku.Domain>(`/apps/${flags.app}/domains`, {
        body: domainCreatePayload,
      })

      if (flags.json) {
        CliUx.ux.styledJSON(domain)
      } else {
        CliUx.ux.log(`Configure your app's DNS provider to point to the DNS Target ${color.green(domain.cname || '')}.
    For help, see https://devcenter.heroku.com/articles/custom-domains`)
        if (domain.status !== 'none') {
          if (flags.wait && flags.app) {
            await waitForDomain(flags.app, this.heroku, domain)
          } else {
            CliUx.ux.log('')
            CliUx.ux.log(`The domain ${color.green(hostname)} has been enqueued for addition`)
            const command = `heroku domains:wait ${shellescape([hostname])}`
            CliUx.ux.log(`Run ${color.cmd(command)} to wait for completion`)
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        CliUx.ux.error(error)
      }
    } finally {
      CliUx.ux.action.stop()
    }
  }
}
