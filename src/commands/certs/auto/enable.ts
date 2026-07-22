import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions, domainExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {printDomains} from '../../../lib/domains/domains.js'
import notify from '../../../lib/notify.js'
import {Domain} from '../../../lib/types/domain.js'

export default class Enable extends Command {
  static description = 'enable ACM status for an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    wait: flags.boolean({description: 'watch ACM status and exit when complete'}),
  }
  public static notifier: (subtitle: string, message: string, success?: boolean) => void = notify
  static topic = 'certs'

  public async run(): Promise<Domain[]> {
    const {flags} = await this.parse(Enable)
    const {app, wait} = flags
    const {platform} = new HerokuSDK({extensions: [appExtensions, domainExtensions]})

    const allCustomTerminal = (domains: Domain[]) =>
      domains.filter(d => d.kind === 'custom').every(d => d.acm_status === 'cert issued' || d.acm_status === 'failed')
    const someCustomNullCname = (domains: Domain[]) =>
      domains.some(d => d.kind === 'custom' && !d.cname)

    ux.action.start('Enabling Automatic Certificate Management')

    const domainsBeforeEnable = await platform.domain.list(app) as Domain[]

    await platform.app.enableACM(app)

    if (wait) {
      ux.action.stop(`${color.info('starting')}.`)
      try {
        const acmDomains = await platform.domain.list(app) as Domain[]
        if (!allCustomTerminal(acmDomains)) {
          ux.action.start('Waiting until the certificate is issued to all domains')
          try {
            await platform.app.waitForACMCertificates(app)
            ux.action.stop()
          } catch (error) {
            ux.action.stop(color.failure('!'))
            throw error
          }
        }

        Enable.notifier('heroku certs:auto:enable', 'Certificate issued to all domains')
      } catch (error) {
        Enable.notifier('heroku certs:auto:enable', 'An error occurred', false)
        hux.styledHeader(`${color.failure('Error')}: The certificate could not be issued to all domains. See status with ${color.code('heroku certs:auto')}.`)
        throw error
      }
    } else {
      ux.action.stop(`${color.info('starting')}. See status with ${color.code('heroku certs:auto')} or wait until active with ${color.code('heroku certs:auto --wait')}`)
    }

    let domains = await platform.domain.list(app) as Domain[]
    if (someCustomNullCname(domains)) {
      ux.action.start('Waiting for stable domains to be created')
      await platform.domain.wait(app)
      domains = await platform.domain.list(app) as Domain[]
      ux.action.stop()
    }

    const changedCnames = domains.filter(domain => {
      const domainBeforeEnable = domainsBeforeEnable.find(d => domain.hostname === d.hostname)
      return domainBeforeEnable && domain.cname !== domainBeforeEnable.cname
    })
    const message = `Your certificate will now be managed by Heroku. Check the status by running ${color.code('heroku certs:auto')}.`

    if (domains.length === 0 || changedCnames.length > 0) {
      printDomains(changedCnames as Parameters<typeof printDomains>[0], message)
    } else {
      hux.styledHeader(message)
    }

    return domains
  }
}
