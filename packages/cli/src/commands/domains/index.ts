import {Command, flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import * as Uri from 'urijs'
import {confirm} from '@inquirer/prompts'
import {paginateRequest} from '../../lib/utils/paginator'
import parseKeyValue from '../../lib/utils/keyValueParser'

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
example-xxxxxxxxxxxx.herokuapp.com

=== example Custom Domains
Domain Name      DNS Record Type  DNS Target
www.example.com  CNAME            www.example.herokudns.com
`, "$ heroku domains --filter 'Domain Name=www.example.com'",
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({description: 'output in json format', char: 'j'}),
    ...ux.table.flags({except: 'no-truncate'}),
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

  getFilteredDomains = (filterKeyValue: string, domains: Array<Heroku.Domain>) => {
    const filteredInfo = {size: 0, filteredDomains: domains}
    const {key: filterName, value} = parseKeyValue(filterKeyValue)

    if (!value) {
      throw new Error('Filter flag has an invalid value')
    }

    if (filterName === 'Domain Name') {
      filteredInfo.filteredDomains = domains.filter(domain => domain.hostname!.includes(value))
    }

    if (filterName === 'DNS Record Type') {
      filteredInfo.filteredDomains = domains.filter(domain => {
        const kind = isApexDomain(domain.hostname!) ? 'ALIAS or ANAME' : 'CNAME'
        return kind.includes(value)
      })
    }

    if (filterName === 'DNS Target') {
      filteredInfo.filteredDomains = domains.filter(domain => domain.cname!.includes(value))
    }

    if (filterName === 'SNI Endpoint') {
      filteredInfo.filteredDomains = domains.filter(domain => {
        if (!domain.sni_endpoint) domain.sni_endpoint = ''
        return domain.sni_endpoint!.includes(value)
      })
    }

    filteredInfo.size = filteredInfo.filteredDomains.length
    return filteredInfo
  }

  async run() {
    const {flags} = await this.parse(DomainsIndex)
    const domains = await paginateRequest<Heroku.Domain>(this.heroku, `/apps/${flags.app}/domains`, 1000)
    const herokuDomain = domains.find((domain: Heroku.Domain) => domain.kind === 'heroku')
    let customDomains = domains.filter((domain: Heroku.Domain) => domain.kind === 'custom')
    let displayTotalDomains = false

    if (flags.filter) {
      customDomains = this.getFilteredDomains(flags.filter, domains).filteredDomains
    }

    if (flags.json) {
      ux.styledJSON(domains)
    } else {
      ux.styledHeader(`${flags.app} Heroku Domain`)
      ux.log(herokuDomain && herokuDomain.hostname)
      if (customDomains && customDomains.length > 0) {
        ux.log()

        if (customDomains.length > 100 && !flags.csv) {
          ux.warn(`This app has over 100 domains. Your terminal may not be configured to display the total amount of domains. You can export all domains into a CSV file with: ${color.cyan('heroku domains -a example-app --csv > example-file.csv')}`)
          displayTotalDomains = await confirm({default: false, message: `Display all ${customDomains.length} domains?`, theme: {prefix: '', style: {defaultAnswer: () => '(Y/N)'}}})

          if (!displayTotalDomains) {
            return
          }
        }

        ux.log()
        ux.styledHeader(`${flags.app} Custom Domains`)
        ux.table(customDomains, this.tableConfig(true), {
          ...flags,
          'no-truncate': true,
        })
      }
    }
  }
}
