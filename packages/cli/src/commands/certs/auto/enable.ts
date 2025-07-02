import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {getDomains, waitForDomains, printDomains, waitForCertIssuedOnDomains} from '../../../lib/domains/domains.js'
import notify from '../../../lib/notify.js'

export default class Enable extends Command {
    static topic = 'certs';
    static description = 'enable ACM status for an app';
    static flags = {
      wait: flags.boolean({description: 'watch ACM status and exit when complete'}),
      app: flags.app({required: true}),
      remote: flags.remote(),
    }

    public static notifier: (subtitle: string, message: string, success?: boolean) => void = notify

    public async run(): Promise<void> {
      const {flags} = await this.parse(Enable)
      const {app, wait} = flags

      ux.action.start('Enabling Automatic Certificate Management')

      const domainsBeforeEnable = await getDomains(this.heroku, app)

      await this.heroku.post(`/apps/${app}/acm`, {body: {}})

      if (wait) {
        ux.action.stop(`${color.yellow('starting')}.`)

        try {
          await waitForCertIssuedOnDomains(this.heroku, app)
          Enable.notifier('heroku certs:auto:enable', 'Certificate issued to all domains')
        } catch (error) {
          Enable.notifier('heroku certs:auto:enable', 'An error occurred', false)
          hux.styledHeader(`${color.red('Error')}: The certificate could not be issued to all domains. See status with ${color.cmd('heroku certs:auto')}.`)
          throw error
        }
      } else {
        ux.action.stop(`${color.yellow('starting')}. See status with ${color.cmd('heroku certs:auto')} or wait until active with ${color.cmd('heroku certs:auto --wait')}`)
      }

      const domains = await waitForDomains(this.heroku, app)
      const changedCnames = domains.filter(function (domain) {
        const domainBeforeEnable = domainsBeforeEnable.find(domainBefore => domain.hostname === domainBefore.hostname)
        return domainBeforeEnable && domain.cname !== domainBeforeEnable.cname
      })
      const message = `Your certificate will now be managed by Heroku. Check the status by running ${color.cmd('heroku certs:auto')}.`

      if (domains.length === 0 || changedCnames.length > 0) {
        printDomains(changedCnames, message)
      } else {
        hux.styledHeader(message)
      }
    }
}
