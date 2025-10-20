import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import Uri from 'urijs'
import {confirm} from '@inquirer/prompts'
import {orderBy} from 'natural-orderby'
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
    columns: flags.string({description: 'only show provided columns (comma-separated)'}),
    extended: flags.boolean({description: 'show extra columns', char: 'x'}),
    filter: flags.string({description: 'filter property by partial string matching, ex: name=foo'}),
    json: flags.boolean({description: 'output in json format', char: 'j'}),
    csv: flags.boolean({description: 'output in csv format', char: 'c'}),
    remote: flags.remote(),
    sort: flags.string({description: 'sort by property'}),
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
      cname: {header: 'DNS Target'},
    }

    if (extended) {
      tableConfig.acm_status = {header: 'ACM Status'}
      tableConfig.acm_status_reason = {header: 'ACM Status'}
    }

    const sniConfig = {
      sni_endpoint: {
        header: 'SNI Endpoint',
        get(domain: Heroku.Domain) {
          if (domain.sni_endpoint) {
            return domain.sni_endpoint.name
          }
        },
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

  mapColumnHeadersToKeys = (columnHeaders: string[]): string[] => {
    const headerToKeyMap: Record<string, string> = {
      'Domain Name': 'hostname',
      'DNS Record Type': 'kind',
      'DNS Target': 'cname',
      'SNI Endpoint': 'sni_endpoint',
      'ACM Status': 'acm_status',
    }

    return columnHeaders.map(header => headerToKeyMap[header.trim()] || header.trim())
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

        if (customDomains.length > 100 && !flags.json && !flags.csv) {
          ux.warn(`This app has over 100 domains. Your terminal may not be configured to display the total amount of domains. You can export all domains into a CSV file with: ${color.cmd('heroku domains -a example-app --csv > example-file.csv')}`)
          displayTotalDomains = await this.confirmDisplayAllDomains(customDomains)
          if (!displayTotalDomains) {
            return
          }
        }

        ux.stdout()
        hux.styledHeader(`${flags.app} Custom Domains`)

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
