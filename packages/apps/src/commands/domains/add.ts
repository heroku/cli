import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'
import {prompt} from 'inquirer'
import * as shellescape from 'shell-escape'
import checkMultiSni from '../../lib/multiple-sni-feature'
import waitForDomain from '../../lib/wait-for-domain'

interface DomainCreatePayload {
  hostname: string;
  sni_endpoint?: string;
}

export default class DomainsAdd extends Command {
  static description = 'add a domain to an app'

  static examples = ['heroku domains:add www.example.com']

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    cert: flags.string({description: 'the name of the SSL cert you want to use for this domain', char: 'c'}),
    json: flags.boolean({description: 'output in json format', char: 'j'}),
    wait: flags.boolean(),
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
    const {args, flags} = this.parse(DomainsAdd)
    const {hostname} = args

    const multipleSniEndpointsEnabled = await checkMultiSni(this.heroku, flags.app)

    const domainCreatePayload: DomainCreatePayload = {
      hostname,
    }

    let certs: Array<Heroku.SniEndpoint> = []

    cli.action.start(`Adding ${color.green(domainCreatePayload.hostname)} to ${color.app(flags.app)}`)
    if (multipleSniEndpointsEnabled) {
      // multiple SNI endpoints is enabled
      if (flags.cert) {
        domainCreatePayload.sni_endpoint = flags.cert
      } else {
        const {body} = await this.heroku.get<Array<Heroku.SniEndpoint>>(`/apps/${flags.app}/sni-endpoints`)

        certs = [...body]
      }
    }

    if (certs.length > 1) {
      cli.action.stop('resolving SNI endpoint')
      const certSelection = await this.certSelect(certs)

      if (certSelection) {
        domainCreatePayload.sni_endpoint = certSelection
      }

      cli.action.start(`Adding ${color.green(domainCreatePayload.hostname)} to ${color.app(flags.app)}`)
    }

    try {
      const {body: domain} = await this.heroku.post<Heroku.Domain>(`/apps/${flags.app}/domains`, {
        body: domainCreatePayload,
      })

      if (flags.json) {
        cli.styledJSON(domain)
      } else {
        cli.log(`Configure your app's DNS provider to point to the DNS Target ${color.green(domain.cname || '')}.
    For help, see https://devcenter.heroku.com/articles/custom-domains`)
        if (domain.status !== 'none') {
          if (flags.wait) {
            await waitForDomain(flags.app, this.heroku, domain)
          } else {
            cli.log('')
            cli.log(`The domain ${color.green(hostname)} has been enqueued for addition`)
            const command = `heroku domains:wait ${shellescape([hostname])}`
            cli.log(`Run ${color.cmd(command)} to wait for completion`)
          }
        }
      }
    } catch (error) {
      cli.error(error)
    } finally {
      cli.action.stop()
    }
  }
}
