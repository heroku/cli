import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color, hux} from '@heroku/heroku-cli-util'
import {describeAddon} from '@heroku/sdk/compositions/add-on'
import {Args} from '@oclif/core'

import {formatPrice, formatState} from '../../lib/addons/util.js'

const topic = 'addons'

export default class Info extends Command {
  static args = {
    addon: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
  }
  static description = 'show detailed add-on resource and attachment information'
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
  }
  static topic = topic
  static usage = `${topic}:info ADDON`

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Info)
    const {app} = flags

    const addon = await describeAddon(args.addon, {appIdentity: app})
    const plan = addon.plan as undefined | {name?: string; price?: Heroku.AddOn['price']}

    hux.styledHeader(color.addon(addon.name ?? ''))
    /* eslint-disable perfectionist/sort-objects */
    hux.styledObject({
      Plan: plan?.name,
      Price: formatPrice({hourly: true, price: plan?.price}),
      'Max Price': formatPrice({hourly: false, price: plan?.price}),
      Attachments: addon.attachments.map(att => [
        color.app(att.app?.name || ''), color.attachment(att.name || ''),
      ].join('::')).sort(),
      'Owning app': color.app(addon.app.name ?? ''),
      'Installed at': (new Date(addon.created_at ?? ''))
        .toString(),
      State: formatState(addon.state),
    })
    /* eslint-enable perfectionist/sort-objects */
  }
}
