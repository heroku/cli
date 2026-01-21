import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'

import {resolveAddon} from '../../lib/addons/resolve.js'
import {formatPrice, formatState, grandfatheredPrice} from '../../lib/addons/util.js'

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

    const addon = await resolveAddon(this.heroku, app, args.addon)
    const {body: attachments} = await this.heroku.get<Heroku.AddOnAttachment[]>(`/addons/${addon.id}/addon-attachments`)

    addon.plan.price = grandfatheredPrice(addon)
    addon.attachments = attachments
    hux.styledHeader(color.addon(addon.name ?? ''))
    /* eslint-disable perfectionist/sort-objects */
    hux.styledObject({
      Plan: addon.plan.name,
      Price: formatPrice({hourly: true, price: addon.plan.price}),
      'Max Price': formatPrice({hourly: false, price: addon.plan.price}),
      Attachments: addon.attachments.map((att: Heroku.AddOnAttachment) => [
        color.app(att.app?.name || ''), color.attachment(att.name || ''),
      ].join('::'))
        .sort(),
      'Owning app': color.app(addon.app?.name ?? ''),
      'Installed at': (new Date(addon.created_at ?? ''))
        .toString(),
      State: formatState(addon.state),
    })
    /* eslint-enable perfectionist/sort-objects */
  }
}
