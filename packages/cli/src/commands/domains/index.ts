import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import Uri from 'urijs'
import {confirm} from '@inquirer/prompts'
import {paginateRequest} from '../../lib/utils/paginator.js'
import parseKeyValue from '../../lib/utils/keyValueParser.js'

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
    app: flags.app({required: true}),
    extended: flags.boolean({description: 'show extra columns', char: 'x'}),
    filter: flags.string({description: 'filter property by partial string matching, ex: name=foo'}),
    json: flags.boolean({description: 'output in json format', char: 'j'}),
    remote: flags.remote(),
    sort: flags.string({description: 'sort by property'}),
  }

  tableConfig = (needsEndpoints: boolean, extended: boolean) => {
    const tableConfig: Record<string, any> = {
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
    }

    if (extended) {
      tableConfig.acm_status = {header: 'ACM Status'}
      tableConfig.acm_status_reason = {header: 'ACM Status'}
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

  mapSortFieldToProperty = (sortField: string): string => {
    const headerToPropertyMap: Record<string, string> = {
      'Domain Name': 'hostname',
      'DNS Record Type': 'kind',
      'DNS Target': 'cname',
      'SNI Endpoint': 'sni_endpoint',
      'ACM Status': 'acm_status',
    }

    return headerToPropertyMap[sortField] || sortField
  }

  async confirmDisplayAllDomains(customDomains: Heroku.Domain[]) {
    return confirm({default: false, message: `Display all ${customDomains.length} domains?`, theme: {prefix: '', style: {defaultAnswer: () => '(Y/N)'}}})
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
      hux.styledJSON(domains)
    } else {
      hux.styledHeader(`${flags.app} Heroku Domain`)
      ux.stdout(herokuDomain && herokuDomain.hostname)
      if (customDomains && customDomains.length > 0) {
        ux.stdout()

        if (customDomains.length > 100 && !flags.csv) {
          ux.warn(`This app has over 100 domains. Your terminal may not be configured to display the total amount of domains. You can export all domains into a CSV file with: ${color.cmd('heroku domains -a example-app --csv > example-file.csv')}`)
          displayTotalDomains = await this.confirmDisplayAllDomains(customDomains)
          if (!displayTotalDomains) {
            return
          }
        }

        ux.stdout()
        hux.styledHeader(`${flags.app} Custom Domains`)
        hux.table(customDomains, this.tableConfig(true, flags.extended), {
          overflow: 'wrap',
          sort: flags.sort ? {[this.mapSortFieldToProperty(flags.sort)]: 'asc'} : undefined,
        })
      }
    }
  }
}
