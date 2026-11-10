import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {addOnExtensions} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

export default class Docs extends Command {
  static args = {
    addon: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
  }
  static description = "open an add-on's Dev Center documentation in your browser"
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    'show-url': flags.boolean({description: 'show URL, do not open browser'}),
  }
  static topic = 'addons'

  public async run(): Promise<string> {
    const {args, flags} = await this.parse(Docs)
    const {app} = flags
    const {platform} = createSDK(this.heroku, {extensions: [addOnExtensions]})
    const id = args.addon.split(':')[0]
    const addonService = await platform.addOnService.info(id).catch(() => null)

    const addon = addonService ?? (await platform.addOn.resolve(id, {appIdentity: app})).addon_service

    const url = `https://devcenter.heroku.com/articles/${addon.name}`
    if (flags['show-url']) {
      ux.stdout(url)
      return url
    }

    if (!await hux.openUrl(url, {prompt: false})) this.exit(1)

    return url
  }
}
