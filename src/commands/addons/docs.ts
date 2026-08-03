import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {addOnExtensions} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'
import open from 'open'

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
  public static urlOpener: (url: string) => Promise<unknown> = open

  public async run(): Promise<string> {
    const {args, flags} = await this.parse(Docs)
    const {app} = flags
    const {platform} = new HerokuSDK({extensions: [addOnExtensions]})
    const id = args.addon.split(':')[0]
    const addonService = await platform.addOnService.info(id).catch(() => null)

    const addon = addonService ?? (await platform.addOn.resolve(id, {appIdentity: app})).addon_service

    const url = `https://devcenter.heroku.com/articles/${addon.name}`
    if (flags['show-url']) {
      ux.stdout(url)
    } else {
      ux.stdout(`Opening ${color.info(url)}...`)
      await Docs.urlOpener(url)
    }

    return url
  }
}
