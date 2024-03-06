import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {getDomains, waitForDomains, printDomains, waitForCertIssuedOnDomains} from '../../../lib/domains/domains'
import notify from '../../../lib/notify'

export default class Enable extends Command {
    static topic = 'certs';
    static description = 'enable ACM status for an app';
    static flags = {
      wait: flags.boolean({description: 'watch ACM status and exit when complete'}),
      app: flags.app({required: true}),
    };

    public async run(): Promise<void> {
      const {flags} = await this.parse(Enable)
      const {app, wait} = flags

      ux.action.start('Enabling Automatic Certificate Management')

      const domainsBeforeEnable = await getDomains(this.heroku, app)

      await this.heroku.post(`/apps/${app}/acm`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'}, body: {},
      })

      if (wait) {
        ux.action.stop(`${color.yellow('starting')}.`)

        try {
          await waitForCertIssuedOnDomains(this.heroku, app)
          notify('heroku certs:auto:enable', 'Certificate issued to all domains')
        } catch (error) {
          notify('heroku certs:auto:enable', 'An error occurred', false)
          ux.styledHeader(`${color.red('Error')}: The certificate could not be issued to all domains. See status with ${color.cmd('heroku certs:auto')}.`)
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
        ux.styledHeader(message)
      }
    }
}
