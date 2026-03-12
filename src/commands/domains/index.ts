import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {confirm} from '@inquirer/prompts'
import {ux} from '@oclif/core'
import {orderBy} from 'natural-orderby'
import Uri from 'urijs'

import parseKeyValue from '../../lib/utils/keyValueParser.js'
import {paginateRequest} from '../../lib/utils/paginator.js'

function isApexDomain(hostname: string) {
  if (hostname.includes('*')) return false
  const a = new Uri({hostname, protocol: 'http'})
  return a.subdomain() === ''
}

export default class DomainsIndex extends Command {
  static description = 'list domains for an app'

  static examples = [`${color.command('heroku domains')}
=== example Heroku Domain
example-xxxxxxxxxxxx.herokuapp.com

=== example Custom Domains
Domain Name      DNS Record Type  DNS Target
www.example.com  CNAME            www.example.herokudns.com
`, `${color.command("heroku domains --filter 'Domain Name=www.example.com'")}
=== example Custom Domains
Domain Name      DNS Record Type  DNS Target
www.example.com  CNAME            www.example.herokudns.com`]

  static flags = {
    app: flags.app({required: true}),
    columns: flags.string({description: 'only show provided columns (comma-separated)'}),
    csv: flags.boolean({char: 'c', description: 'output in csv format'}),
    extended: flags.boolean({char: 'x', description: 'show extra columns'}),
    filter: flags.string({description: 'filter property by partial string matching, ex: name=foo'}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    remote: flags.remote(),
    sort: flags.string({description: 'sort by property'}),
  }

  getFilteredDomains = (filterKeyValue: string, domains: Array<Heroku.Domain>) => {
    const filteredInfo = {filteredDomains: domains, size: 0}
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

  mapColumnHeadersToKeys = (columnHeaders: string[]): string[] => {
    const headerToKeyMap: Record<string, string> = {
      'ACM Status': 'acm_status',
      'DNS Record Type': 'kind',
      'DNS Target': 'cname',
      'Domain Name': 'hostname',
      'SNI Endpoint': 'sni_endpoint',
    }

    return columnHeaders.map(header => headerToKeyMap[header.trim()] || header.trim())
  }

  mapSortFieldToProperty = (sortField: string): string => {
    const headerToPropertyMap: Record<string, string> = {
      'ACM Status': 'acm_status',
      'DNS Record Type': 'kind',
      'DNS Target': 'cname',
      'Domain Name': 'hostname',
      'SNI Endpoint': 'sni_endpoint',
    }

    return headerToPropertyMap[sortField] || sortField
  }

  outputCSV = (customDomains: Heroku.Domain[], tableConfig: Record<string, any>, sortProperty?: string) => {
    const getValue = (domain: Heroku.Domain, key: string, config?: Record<string, any>) => {
      const columnConfig = config ?? tableConfig[key]
      return columnConfig?.get?.(domain) ?? domain[key] ?? ''
    }

    const escapeCSV = (value: string) => {
      const needsEscaping = /["\n\r,]/.test(value)
      return needsEscaping ? `"${value.replaceAll('"', '""')}"` : value
    }

    const columns = Object.entries(tableConfig)

    const columnHeaders = columns.map(([key, config]) => config.header || key)
    ux.stdout(columnHeaders.join(','))

    if (sortProperty) {
      customDomains = orderBy(customDomains, [domain => getValue(domain, sortProperty)], ['asc'])
    }

    for (const domain of customDomains) {
      const row = columns.map(([key, config]) => escapeCSV(getValue(domain, key, config)))
      ux.stdout(row.join(','))
    }
  }

  tableConfig = (needsEndpoints: boolean, extended: boolean, requestedColumns?: string[]) => {
    const tableConfig: Record<string, any> = {
      hostname: {
        header: 'Domain Name',
      },
      kind: {
        get(domain: Heroku.Domain) {
          if (domain.hostname) {
            return isApexDomain(domain.hostname) ? 'ALIAS or ANAME' : 'CNAME'
          }
        },
        header: 'DNS Record Type',
      },
      // eslint-disable-next-line perfectionist/sort-objects
      cname: {header: 'DNS Target'},
    }

    if (extended) {
      tableConfig.acm_status = {header: 'ACM Status'}
      tableConfig.acm_status_reason = {header: 'ACM Status'}
    }

    const sniConfig = {
      sni_endpoint: {
        get(domain: Heroku.Domain) {
          if (domain.sni_endpoint) {
            return domain.sni_endpoint.name
          }
        },
        header: 'SNI Endpoint',
      },
    }

    let fullConfig = tableConfig
    if (needsEndpoints) {
      fullConfig = {
        ...tableConfig,
        ...sniConfig,
      }
    }

    // If specific columns are requested, filter the configuration
    if (requestedColumns && requestedColumns.length > 0) {
      const filteredConfig: Record<string, any> = {}
      requestedColumns.forEach(columnKey => {
        if (fullConfig[columnKey]) {
          filteredConfig[columnKey] = fullConfig[columnKey]
        }
      })
      return filteredConfig
    }

    return fullConfig
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
      hux.styledHeader(`${color.app(flags.app)} Heroku Domain`)
      ux.stdout(herokuDomain && color.info(herokuDomain.hostname!))
      if (customDomains && customDomains.length > 0) {
        ux.stdout()

        if (customDomains.length > 100 && !flags.json && !flags.csv) {
          ux.warn(`This app has over 100 domains. Your terminal may not be configured to display the total amount of domains. You can export all domains into a CSV file with: ${color.code('heroku domains -a example-app --csv > example-file.csv')}`)
          displayTotalDomains = await this.confirmDisplayAllDomains(customDomains)
          if (!displayTotalDomains) {
            return
          }
        }

        ux.stdout()
        hux.styledHeader(`${color.app(flags.app)} Custom Domains`)

        const tableConfig = this.tableConfig(true, flags.extended, flags.columns ? this.mapColumnHeadersToKeys(flags.columns.split(',')) : undefined)
        const sortProperty = this.mapSortFieldToProperty(flags.sort)

        if (flags.csv) {
          this.outputCSV(customDomains, tableConfig, sortProperty)
        } else {
          hux.table(customDomains, tableConfig, {
            overflow: 'wrap',
            sort: flags.sort ? {[sortProperty]: 'asc'} : undefined,
          })
        }
      }
    }
  }
}
