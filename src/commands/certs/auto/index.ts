import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {formatDistanceToNow} from 'date-fns'
import tsheredoc from 'tsheredoc'

import {displayCertificateDetails} from '../../../lib/certs/certificate_details.js'
import {waitForCertIssuedOnDomains} from '../../../lib/domains/domains.js'
import {Domain} from '../../../lib/types/domain.js'
import {SniEndpoint} from '../../../lib/types/sni_endpoint.js'

const heredoc = tsheredoc.default

function humanize(value: null | string) {
  if (!value) {
    return color.info('Waiting')
  }

  if (value === 'ok') {
    return color.success('OK')
  }

  if (value === 'failed') {
    return color.failure('Failed')
  }

  if (value === 'verified') {
    return color.info('In Progress')
  }

  if (value === 'dns-verified') {
    return color.info('DNS Verified')
  }

  return value.split('-')
    .map(word => word.replace(/(^[a-z])/, text => text.toUpperCase()))
    .join(' ')
}

export default class Index extends Command {
  static command: 'auto'
  static description = 'show ACM status for an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    wait: flags.boolean({description: 'watch ACM status and display the status when complete'}),
  }

  static topic = 'certs'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const [{body: app}, {body: sniEndpoints}] = await Promise.all([
      this.heroku.get<Required<Heroku.App>>(`/apps/${flags.app}`),
      this.heroku.get<SniEndpoint[]>(`/apps/${flags.app}/sni-endpoints`),
    ])

    if (!app.acm) {
      hux.styledHeader(`Automatic Certificate Management is ${color.inactive('disabled')} on ${color.app(flags.app)}`)
      return
    }

    hux.styledHeader(`Automatic Certificate Management is ${color.success('enabled')} on ${color.app(flags.app)}`)

    if (sniEndpoints.length === 1 && sniEndpoints[0].ssl_cert.acm) {
      displayCertificateDetails(sniEndpoints[0])
      ux.stdout('')
    }

    if (flags.wait) {
      await waitForCertIssuedOnDomains(this.heroku, flags.app).catch(() => {})
    }

    let {body: domains} = await this.heroku.get<Domain[]>(`/apps/${flags.app}/domains`)

    domains = domains.filter(domain => domain.kind === 'custom')

    let message
    if (domains.length === 0) {
      message = `Add a custom domain to your app by running: ${color.code('heroku domains:add <yourdomain.com>')}`
    } else if (domains.some(domain => domain.acm_status === 'failed')) {
      message = heredoc`
        Some domains failed validation after multiple attempts, retry by running: ${color.code('heroku certs:auto:refresh')}
            See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons`
    } else if (domains.some(domain => domain.acm_status === 'failing')) {
      message = heredoc`
        Some domains are failing validation, please verify that your DNS matches: ${color.code('heroku domains')}
            See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons`
    }

    if (domains.length > 0) {
      hux.table<Record<keyof Domain, unknown>>(
        domains,
        {
          Domain: {
            get: (domain: Domain) => domain.hostname,
          },
          Status: {
            get: (domain: Domain) => humanize(domain.acm_status),
          },
          ...(domains.some(d => d.acm_status_reason) ? {
            Reason: {
              get: (domain: Domain) => domain.acm_status_reason ?? '',
            },
          } : {}),
          lastUpdated: {
            get: (domain: Domain) => formatDistanceToNow(new Date(domain.updated_at)),
            header: 'Last Updated',
          },
        },
      )
      if (message) {
        ux.stdout('')
      }
    }

    if (message) {
      hux.styledHeader(message)
    }
  }
}
