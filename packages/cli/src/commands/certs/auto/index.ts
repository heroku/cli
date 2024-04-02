import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {displayCertificateDetails} from '../../../lib/certs/certificate_details'
import {waitForCertIssuedOnDomains} from '../../../lib/domains/domains'
import {formatDistanceToNow} from 'date-fns'
import {SniEndpoint} from '../../../lib/types/sni_endpoint'
import {Domain} from '../../../lib/types/domain'
import heredoc from 'tsheredoc'

function humanize(value: string | null) {
  if (!value) {
    return color.yellow('Waiting')
  }

  if (value === 'ok') {
    return color.green('OK')
  }

  if (value === 'failed') {
    return color.red('Failed')
  }

  if (value === 'verified') {
    return color.yellow('In Progress')
  }

  if (value === 'dns-verified') {
    return color.yellow('DNS Verified')
  }

  return value.split('-')
    .map(word => word.replace(/(^[a-z])/, text => text.toUpperCase()))
    .join(' ')
}

export default class Index extends Command {
  static topic = 'certs'
  static command: 'auto'
  static description = 'show ACM status for an app'
  static flags = {
    wait: flags.boolean({description: 'watch ACM status and display the status when complete'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const [{body: app}, {body: sniEndpoints}] = await Promise.all([
      this.heroku.get<Required<Heroku.App>>(`/apps/${flags.app}`),
      this.heroku.get<SniEndpoint[]>(`/apps/${flags.app}/sni-endpoints`),
    ])

    if (!app.acm) {
      ux.styledHeader(`Automatic Certificate Management is ${color.yellow('disabled')} on ${flags.app}`)
      return
    }

    ux.styledHeader(`Automatic Certificate Management is ${color.green('enabled')} on ${flags.app}`)

    if (sniEndpoints.length === 1 && sniEndpoints[0].ssl_cert.acm) {
      displayCertificateDetails(sniEndpoints[0])
      ux.log('')
    }

    if (flags.wait) {
      await waitForCertIssuedOnDomains(this.heroku, flags.app).catch(() => {})
    }

    let {body: domains} = await this.heroku.get<Domain[]>(`/apps/${flags.app}/domains`)

    domains = domains.filter(domain => domain.kind === 'custom')

    let message
    if (domains.length === 0) {
      message = `Add a custom domain to your app by running: ${color.cmd('heroku domains:add <yourdomain.com>')}`
    } else if (domains.some(domain => domain.acm_status === 'failed')) {
      message = heredoc`
        Some domains failed validation after multiple attempts, retry by running: ${color.cmd('heroku certs:auto:refresh')}
            See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons`
    } else if (domains.some(domain => domain.acm_status === 'failing')) {
      message = heredoc`
        Some domains are failing validation, please verify that your DNS matches: ${color.cmd('heroku domains')}
            See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons`
    }

    if (domains.length > 0) {
      ux.table<Record<keyof Domain, unknown>>(
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
              get: (domain: Domain) => domain.acm_status_reason ? domain.acm_status_reason : '',
            },
          } : {}),
          lastUpdated: {
            header: 'Last Updated',
            get: (domain: Domain) => formatDistanceToNow(new Date(domain.updated_at)),
          },
        },
      )
      if (message) {
        ux.log('')
      }
    }

    if (message) {
      ux.styledHeader(message)
    }
  }
}
