import {Command, flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import * as Uri from 'urijs'
import {confirm} from '@inquirer/prompts'
import {paginateRequest} from '../../lib/utils/paginator'

function isApexDomain(hostname: string) {
  if (hostname.includes('*')) return false
  const a = new Uri({protocol: 'http', hostname})
  return a.subdomain() === ''
}

interface FilteredDomainsInfo {
  size: number,
  filteredDomains: Array<Heroku.Domain>
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

  // put into utility lib
  splitKeyValuePair(input: string) {
    let [key, value] = input.split(/=(.+)/)

    key = key.trim()
    value = value ? value.trim() : ''

    return {key, value}
  }

  getFilteredDomains = (filterKeyValue: string, domains: Array<Heroku.Domain>) => {
    const filteredInfo: FilteredDomainsInfo = {size: 0, filteredDomains: domains}
    // parse --filter key-value pair
    const {key: filterName, value} = this.splitKeyValuePair(filterKeyValue)

    // filter table headers by value from --filter
    // return size from filter

    if (filterName === 'Domain Name') {
      console.log('WE ARE HERE')
      filteredInfo.filteredDomains = domains.filter(domain => domain.hostname!.includes(value))
    }

    // if (filterName === 'DNS Record Type') {
    //   // eslint-disable-next-line array-callback-return
    //   const filteredDomains = domains.filter(domain => {
    //     const kind = isApexDomain(domain.hostname!) ? 'ALIAS or ANAME' : 'CNAME'
    //     kind.includes(value)
    //   })
    //   return filteredDomains.length
    // }

    // if (filterName === 'DNS Target') {
    //   const filteredDomains = domains.filter(domain => domain.cname!.includes(value))
    //   console.log('filteredDomains', filteredDomains.length)
    //   return filteredDomains.length
    // }

    // if (filterName === 'SNI Endpoint') {
    //   const filteredDomains = domains.filter(domain => domain.sni_endpoint!.includes(value))
    //   return filteredDomains.length
    // }

    filteredInfo.size = filteredInfo.filteredDomains.length
    return filteredInfo
  }

  async run() {
    const {flags} = await this.parse(DomainsIndex)
    // const {body: domains, headers: headerInfo} = await this.heroku.get<Array<Heroku.Domain>>(`/apps/${flags.app}/domains`)
    const {body: domains, headers: headerInfo, statusCode: code} = await paginateRequest(this.heroku, `/apps/${flags.app}/domains`, 1000)
    const herokuDomain = domains.find(domain => domain.kind === 'heroku')
    let customDomains: Array<Heroku.Domain> | undefined = domains.filter(domain => domain.kind === 'custom')
    // let filteredDomains: FilteredDomainsInfo | undefined = {size: 0, filteredDomains: []}
    let displayTotalDomains = false

    // console.log('headerInfo', domainsNew)
    // console.log('statusCode', code)
    // console.log('headerInfo', headerInfo)

    if (flags.filter) {
      customDomains = this.getFilteredDomains(flags.filter, domains).filteredDomains
      // customDomains = filteredDomains?.filteredDomains
    }

    if (flags.json) {
      ux.styledJSON(domains)
    } else {
      ux.styledHeader(`${flags.app} Heroku Domain`)
      ux.log(herokuDomain && herokuDomain.hostname)
      if (customDomains && customDomains.length > 0) {
        // console.log('# of custom domains', customDomains.length)
        // console.log('# of total domains', domains.length)
        // ux.log()
        // console.log('filteredDomains', filteredDomains)

        if (customDomains.length > 100 && !flags.csv) {
          ux.warn(`This app has over 100 domains. Your terminal may not be configured to display the total amount of domains. We recommend outputting this information to a csv file: ${color.cyan('heroku domains -a example-app --csv > example-file.txt')}`)
          displayTotalDomains = await confirm({default: false, message: `Display all ${customDomains.length} domains?`})

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
