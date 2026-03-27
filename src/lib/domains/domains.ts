import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'
import {getSubdomain} from 'tldts'

const wait = function (ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export async function getDomains(heroku: APIClient, app: string) {
  const {body: domains} = await heroku.get<Required<Heroku.Domain>[]>(`/apps/${app}/domains`)
  return domains
}

export function printDomains(domains: Required<Heroku.Domain>[], message: string) {
  domains = domains.filter(domain => domain.kind === 'custom')
  const domains_with_type: (Required<Heroku.Domain> & { type: string })[] = domains.map(domain => ({...domain, type: type(domain)}))

  if (domains_with_type.length === 0) {
    hux.styledHeader(`${message}  Add a custom domain to your app by running ${color.code('heroku domains:add <yourdomain.com>')}`)
  } else {
    hux.styledHeader(`${message}  Update your application's DNS settings as follows`)

    hux.table(domains_with_type,
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
    )
  }
}

export async function waitForCertIssuedOnDomains(heroku: APIClient, app: string) {
  function certIssuedOrFailedForAllCustomDomains(domains: Required<Heroku.Domain>[]) {
    domains = domains.filter(domain => domain.kind === 'custom')
    return domains.every(domain => domain.acm_status === 'cert issued' || domain.acm_status === 'failed')
  }

  function someFailed(domains: Required<Heroku.Domain>[]) {
    domains = domains.filter(domain => domain.kind === 'custom')
    return domains.some(domain => domain.acm_status === 'failed')
  }

  function backoff(attempts: number) {
    const wait = 15 * 1000
    // Don't wait more than 60 seconds
    const multiplier = attempts < 60 ? Math.floor(attempts / 20) : 3
    const extraWait = wait * multiplier
    return wait + extraWait
  }

  let domains = await getDomains(heroku, app)

  if (!certIssuedOrFailedForAllCustomDomains(domains)) {
    ux.action.start('Waiting until the certificate is issued to all domains')

    let retries = 0
    while (!certIssuedOrFailedForAllCustomDomains(domains)) {
      await wait(backoff(retries))
      domains = await getDomains(heroku, app)
      retries++
    }

    if (someFailed(domains)) {
      ux.action.stop(color.failure('!'))
      throw new Error('ACM not enabled for some domains')
    }

    ux.action.stop()
  }
}

export async function waitForDomains(heroku: APIClient, app: string) {
  function someNull(domains: Required<Heroku.Domain>[]) {
    return domains.some(domain => domain.kind === 'custom' && !domain.cname)
  }

  let apiDomains = await getDomains(heroku, app)

  if (someNull(apiDomains)) {
    ux.action.start('Waiting for stable domains to be created')

    let index = 0
    do {
      // trying 30 times was easier for me to test that setTimeout
      if (index >= 30) {
        throw new Error('Timed out while waiting for stable domains to be created')
      }

      await wait(1000)
      apiDomains = await getDomains(heroku, app)

      index++
    } while (someNull(apiDomains))
  }

  return apiDomains
}

function type(domain: Required<Heroku.Domain>) {
  // Get subdomain with allowPrivateDomains to match psl behavior
  const subdomain = getSubdomain(domain.hostname, {allowPrivateDomains: true})

  // If subdomain is null or empty string, it's a root domain (ALIAS/ANAME)
  // Otherwise, it's a subdomain (CNAME)
  return subdomain === null || subdomain === '' ? 'ALIAS/ANAME' : 'CNAME'
}
