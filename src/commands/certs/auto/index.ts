import type {App, Domain as SdkDomain, SniEndpoint as SdkSniEndpoint} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'
import tsheredoc from 'tsheredoc'

import {formatCertificateDetails} from '../../../lib/certs/certificate-details.js'
import {lazyModuleLoader} from '../../../lib/lazy-module-loader.js'
import {createSDK} from '../../../lib/sdk.js'
import {Domain} from '../../../lib/types/domain.js'
import {SniEndpoint} from '../../../lib/types/sni-endpoint.js'

const heredoc = tsheredoc

type AcmStatus = {app: App; domains: SdkDomain[]; sniEndpoints: SdkSniEndpoint[]}

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
  static enableJsonFlag = true
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    wait: flags.boolean({description: 'watch ACM status and display the status when complete'}),
  }
  static topic = 'certs'

  public async run(): Promise<AcmStatus> {
    const {formatDistanceToNow} = await lazyModuleLoader.loadDateFns()

    const {flags} = await this.parse(Index)
    const {platform} = createSDK(this.heroku, {extensions: [appExtensions]})
    const [app, sniEndpoints] = await Promise.all([
      platform.app.info(flags.app),
      platform.sniEndpoint.list(flags.app),
    ])

    if (!app.acm) {
      this.log(hux.styledHeader(`Automatic Certificate Management is ${color.inactive('disabled')} on ${color.app(flags.app)}`))
      return {app, domains: await platform.domain.list(flags.app), sniEndpoints}
    }

    this.log(hux.styledHeader(`Automatic Certificate Management is ${color.success('enabled')} on ${color.app(flags.app)}`))

    const localSniEndpoints = sniEndpoints as SniEndpoint[]
    if (localSniEndpoints.length === 1 && localSniEndpoints[0].ssl_cert.acm) {
      this.log(formatCertificateDetails(localSniEndpoints[0]))
      this.log('')
    }

    if (flags.wait) {
      ux.action.start('Waiting until the certificate is issued to all domains')
      try {
        await platform.app.waitForACMCertificates(flags.app)
        ux.action.stop()
      } catch (error) {
        ux.action.stop(color.failure('!'))
        throw error
      }
    }

    const allDomains = await platform.domain.list(flags.app)
    // The table shows custom domains only; --json returns every domain.
    const domains = (allDomains as Domain[]).filter(domain => domain.kind === 'custom')

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
      this.log(hux.table<Record<keyof Domain, unknown>>(
        domains,
        {
          Domain: {
            get: (domain: Domain) => domain.hostname,
          },
          Status: {
            get: (domain: Domain) => humanize(domain.acm_status),
          },
          ...(domains.some(d => d.acm_status_reason)
            ? {
              Reason: {
                get: (domain: Domain) => domain.acm_status_reason ?? '',
              },
            }
            : {}),
          lastUpdated: {
            get: (domain: Domain) => formatDistanceToNow(new Date(domain.updated_at)),
            header: 'Last Updated',
          },
        },
      ))
      if (message) {
        this.log('')
      }
    }

    if (message) {
      this.log(hux.styledHeader(message))
    }

    return {app, domains: allDomains, sniEndpoints}
  }
}
