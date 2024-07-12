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

  async run() {
    const {flags} = await this.parse(DomainsIndex)
    // const {body: domains, headers: headerInfo} = await this.heroku.get<Array<Heroku.Domain>>(`/apps/${flags.app}/domains`)
    const {body: domains, headers: headerInfo, statusCode: code} = await paginateRequest(this.heroku, `/apps/${flags.app}/domains`, 1000)
    const herokuDomain = domains.find(domain => domain.kind === 'heroku')
    const customDomains = domains.filter(domain => domain.kind === 'custom')
    let displayTotalDomains = false

    // console.log('headerInfo', domainsNew)
    // console.log('statusCode', code)
    // console.log('headerInfo', headerInfo)

    if (flags.json) {
      ux.styledJSON(domains)
    } else {
      ux.styledHeader(`${flags.app} Heroku Domain`)
      ux.log(herokuDomain && herokuDomain.hostname)
      if (customDomains && customDomains.length > 0) {
        // console.log('# of custom domains', customDomains.length)
        // console.log('# of total domains', domains.length)
        // ux.log()
        if (customDomains.length > 100 && !flags.csv) {
          ux.warn(`This app has over 100 domains. Your terminal may not be configured to display the total amount of domains. We recommend outputting this information to a csv file: ${color.cyan('heroku domains -a example-app --csv > example-file.txt')}`)
          displayTotalDomains = await confirm({default: false, message: 'Display total list of custom domains?'})

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
