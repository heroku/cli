import * as Heroku from '@heroku-cli/schema'
import {color, hux} from '@heroku/heroku-cli-util'
import {parse} from 'tldts'

export function formatDomains(domains: Required<Heroku.Domain>[], message: string): string {
  domains = domains.filter(domain => domain.kind === 'custom')
  const domains_with_type: (Required<Heroku.Domain> & {type: string})[] = domains.map(domain => ({...domain, type: dnsRecordType(domain)}))

  if (domains_with_type.length === 0) {
    return hux.styledHeader(`${message}  Add a custom domain to your app by running ${color.code('heroku domains:add <yourdomain.com>')}`)
  }

  return [
    hux.styledHeader(`${message}  Update your application's DNS settings as follows`),
    hux.table(
      domains_with_type,
      {
        domain: {
          get: ({hostname}) => hostname,
          header: 'Domain',
        },
        recordType: {
          get: ({type}) => type,
          header: 'Record Type',
        },
        // eslint-disable-next-line perfectionist/sort-objects
        dnsTarget: {
          get: ({cname}) => cname,
          header: 'DNS Target',
        },
      },
    ),
  ].join('\n')
}

/** The DNS record type a custom domain needs: CNAME for a subdomain, ALIAS/ANAME for a root domain. */
export function dnsRecordType(domain: Pick<Heroku.Domain, 'hostname'> & {hostname: string}) {
  // Wildcard domains (*.example.com) are always treated as subdomains (CNAME)
  // This must be checked before parsing since wildcards aren't valid hostnames
  if (domain.hostname.includes('*')) {
    return 'CNAME'
  }

  // Parse the domain with private domains enabled (for .herokuapp.com, etc.)
  const result = parse(domain.hostname, {allowPrivateDomains: true})

  // Reject invalid or unparsable hostnames (e.g., "notadomain", "localhost", IPs, empty strings)
  // All of these result in domain === null
  if (result.domain === null) {
    throw new Error(`Invalid hostname: ${domain.hostname}`)
  }

  // Empty string subdomain means root domain → ALIAS/ANAME
  // Non-empty subdomain means has subdomain → CNAME
  return result.subdomain ? 'CNAME' : 'ALIAS/ANAME'
}
