/* eslint-disable no-await-in-loop */

import {APIClient} from '@heroku-cli/command'
import {parse, ParsedDomain, ParseError} from 'psl'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'

const wait = function (ms: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

function isParseError(parsed: ParsedDomain | ParseError): parsed is ParseError {
  return (parsed as ParseError).error !== undefined
}

export async function getDomains(heroku: APIClient, app: string) {
  const {body: domains} = await heroku.get<Required<Heroku.Domain>[]>(`/apps/${app}/domains`)
  return domains
}

function type(domain: Required<Heroku.Domain>) {
  const parsed = parse(domain.hostname)

  if (isParseError(parsed)) {
    throw new Error(parsed.error.message)
  }

  return parsed.subdomain === null ? 'ALIAS/ANAME' : 'CNAME'
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

export function printDomains(domains: Required<Heroku.Domain>[], message: string) {
  domains = domains.filter(domain => domain.kind === 'custom')
  const domains_with_type: Required<Heroku.Domain & { type: string }>[] = domains.map(domain => Object.assign({}, domain, {type: type(domain)}))

  if (domains_with_type.length === 0) {
    ux.styledHeader(`${message}  Add a custom domain to your app by running ${color.app('heroku domains:add <yourdomain.com>')}`)
  } else {
    ux.styledHeader(`${message}  Update your application's DNS settings as follows`)

    ux.table(domains_with_type,
      {
        Domain: {
          get: ({hostname}) => hostname,
        },
        'Record Type': {
          get: ({type}) => type,
        },
        'DNS Target': {
          get: ({cname}) => cname,
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
      throw new Error('ACM not enabled for some domains')
    }
  }
}
