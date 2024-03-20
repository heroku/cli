import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import confirmApp from '../../../lib/apps/confirm-app'
import heredoc from 'tsheredoc'

export default class Disable extends Command {
  static topic = 'certs';
  static description = 'disable ACM for an app';
  static flags = {
    confirm: flags.string({char: 'c', hidden: true}),
    app: flags.app({required: true}),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Disable)
    const {app, confirm} = flags

    const warning = heredoc(`
      This command will disable Automatic Certificate Management from ${color.app(app)}.
      This will cause the certificate to be removed from ${color.app(app)} causing SSL
      validation errors.  In order to avoid downtime, the recommended steps
      are preferred which will also disable Automatic Certificate Management.

      1) Request a new SSL certificate for your domains names from your certificate provider
      2) heroku certs:update CRT KEY
    `)
    await confirmApp(app, confirm, warning)

    ux.action.start('Disabling Automatic Certificate Management')
    await this.heroku.delete(`/apps/${app}/acm`)
    ux.action.stop()
  }
}
