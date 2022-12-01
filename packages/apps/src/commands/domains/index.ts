import {Flags, CliUx} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import Uri = require('urijs')

function isApexDomain(hostname: string) {
  if (hostname.includes('*')) return false
  const a = new Uri({protocol: 'http', hostname})
  return a.subdomain() === ''
}

export default class DomainsIndex extends Command {
  static description = 'list domains for an app'

  static examples = [
    `$ heroku domains
=== example Heroku Domain
example.herokuapp.com

=== example Custom Domains
Domain Name      DNS Record Type  DNS Target
www.example.com  CNAME            www.example.herokudns.com
`, "$ heroku domains --filter 'Domain Name=www.example.com'",
  ]

  static flags = {
    help: Flags.help({char: 'h'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: Flags.boolean({description: 'output in json format', char: 'j'}),
    ...CliUx.ux.table.flags({except: 'no-truncate'}),
  }

  tableConfig = (needsEndpoints: boolean) => {
    const tableConfig = {
      hostname: {
        header: 'Domain Name',
      },
      kind: {
        header: 'DNS Record Type',
        get: (domain: Heroku.Domain) => {
          if (domain.hostname) {
            return isApexDomain(domain.hostname) ? 'ALIAS or ANAME' : 'CNAME'
          }
        },
      },
      cname: {header: 'DNS Target'},
      acm_status: {header: 'ACM Status', extended: true},
      acm_status_reason: {header: 'ACM Status', extended: true},
    }

    const sniConfig = {
      sni_endpoint: {
        header: 'SNI Endpoint',
        get: (domain: Heroku.Domain) => {
          if (domain.sni_endpoint) {
            return domain.sni_endpoint.name
          }
        },
      },
    }

    if (needsEndpoints) {
      return {
        ...tableConfig,
        ...sniConfig,
      }
    }

    return tableConfig
  }

  async run() {
    const {flags} = await this.parse(DomainsIndex)
    const {body: domains} = await this.heroku.get<Array<Heroku.Domain>>(`/apps/${flags.app}/domains`)
    const herokuDomain = domains.find(domain => domain.kind === 'heroku')
    const customDomains = domains.filter(domain => domain.kind === 'custom')

    if (flags.json) {
      CliUx.ux.styledJSON(domains)
    } else {
      CliUx.ux.styledHeader(`${flags.app} Heroku Domain`)
      CliUx.ux.log(herokuDomain && herokuDomain.hostname)
      if (customDomains && customDomains.length > 0) {
        CliUx.ux.log()
        CliUx.ux.styledHeader(`${flags.app} Custom Domains`)
        CliUx.ux.table(customDomains, this.tableConfig(true), {
          ...flags,
          'no-truncate': true,
        })
      }
    }
  }
}
