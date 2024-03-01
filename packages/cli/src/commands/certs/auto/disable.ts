import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import confirmApp from '../../../lib/apps/confirm-app'

export default class Disable extends Command {
  static topic = 'certs';
  static description = 'disable ACM for an app';
  static flags = {
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Disable)
    const {app, confirm} = flags

    const warning = `This command will disable Automatic Certificate Management from ${color.magenta(app)}.\nThis will cause the certificate to be removed from ${app} causing SSL\nvalidation errors.  In order to avoid downtime, the recommended steps\nare preferred which will also disable Automatic Certificate Management.\n\n1) Request a new SSL certificate for your domains names from your certificate provider\n2) heroku certs:update CRT KEY\n`
    await confirmApp(warning, confirm)

    ux.action.start('Disabling Automatic Certificate Management')
    await this.heroku.delete(`/apps/${app}/acm`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })
    ux.action.stop()
  }
}
