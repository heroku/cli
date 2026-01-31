import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import open from 'open'

import {resolveAddon} from '../../lib/addons/resolve.js'

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

  public async run(): Promise<void> {
    const {args,  flags} = await this.parse(Docs)
    const {app} = flags
    const id = args.addon.split(':')[0]
    const addonResponse = await this.heroku.get<Heroku.AddOn>(`/addon-services/${encodeURIComponent(id)}`)
      .catch(() => null)

    const addon = addonResponse?.body ?? (await resolveAddon(this.heroku, app, id)).addon_service

    const url = `https://devcenter.heroku.com/articles/${addon.name}`
    if (flags['show-url']) {
      ux.stdout(url)
    } else {
      ux.stdout(`Opening ${color.info(url)}...`)
      await Docs.urlOpener(url)
    }
  }
}
