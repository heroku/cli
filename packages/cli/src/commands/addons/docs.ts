import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {resolveAddon} from '../../lib/addons/resolve.js'
import open from 'open'

export default class Docs extends Command {
  static topic = 'addons'
  static description = "open an add-on's Dev Center documentation in your browser"
  static flags = {
    'show-url': flags.boolean({description: 'show URL, do not open browser'}),
    app: flags.app(),
    remote: flags.remote(),
  }

  static args = {
    addon: Args.string({required: true, description: 'unique identifier or globally unique name of the add-on'}),
  }

  public static urlOpener: (url: string) => Promise<unknown> = open

  public async run(): Promise<void> {
    const {flags,  args} = await this.parse(Docs)
    const {app} = flags
    const id = args.addon.split(':')[0]
    const addonResponse = await this.heroku.get<Heroku.AddOn>(`/addon-services/${encodeURIComponent(id)}`)
      .catch(() => null)

    const addon = addonResponse?.body ?? (await resolveAddon(this.heroku, app, id)).addon_service

    const url = `https://devcenter.heroku.com/articles/${addon.name}`
    if (flags['show-url']) {
      ux.stdout(url)
    } else {
      ux.stdout(`Opening ${color.cyan(url)}...`)
      await Docs.urlOpener(url)
    }
  }
}
