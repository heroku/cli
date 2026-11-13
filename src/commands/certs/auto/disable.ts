import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import * as color from '@heroku/heroku-cli-util/color'
import {App} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'
import tsheredoc from 'tsheredoc'

import {createSDK} from '../../../lib/sdk.js'

const heredoc = tsheredoc

export default class Disable extends Command {
  static description = 'disable ACM for an app'
  static enableJsonFlag = true
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c', description: 'set to app name to bypass confirm prompt'}),
    remote: flags.remote(),
  }
  static topic = 'certs'

  public async run(): Promise<App> {
    const {platform} = createSDK(this.heroku)
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
    await hux.confirmCommand({
      comparison: app,
      confirmation: confirm,
      json: this.jsonEnabled(),
      warningMessage: warning,
    })

    ux.action.start('Disabling Automatic Certificate Management')
    const disabledApp = await platform.app.disableACM(app)

    ux.action.stop()

    return disabledApp
  }
}
