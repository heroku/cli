import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../../lib/confirmCommand.js'

const heredoc = tsheredoc.default

export default class Disable extends Command {
  static description = 'disable ACM for an app'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c', hidden: true}),
    remote: flags.remote(),
  }

  static topic = 'certs'

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
    await new ConfirmCommand().confirm(app, confirm, warning)

    ux.action.start('Disabling Automatic Certificate Management')
    await this.heroku.delete(`/apps/${app}/acm`)
    ux.action.stop()
  }
}
