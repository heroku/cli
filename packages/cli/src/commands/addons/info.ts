import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {grandfatheredPrice, formatPrice, formatState} from '../../lib/addons/util'
import {resolveAddon} from '../../lib/addons/resolve'

const topic = 'addons'

export default class Info extends Command {
  static topic = topic
  static description = 'show detailed add-on resource and attachment information'
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
  }

  static usage = `${topic}:info ADDON`
  static args = {
    addon: Args.string({required: true, description: 'unique identifier or globally unique name of the add-on'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Info)
    const {app} = flags

    const addon = await resolveAddon(this.heroku, app, args.addon)
    const {body: attachments} = await this.heroku.get<Heroku.AddOnAttachment[]>(`/addons/${addon.id}/addon-attachments`)

    addon.plan.price = grandfatheredPrice(addon)
    addon.attachments = attachments
    ux.styledHeader(color.magenta(addon.name ?? ''))

    ux.styledObject({
      Plan: addon.plan.name,
      Price: formatPrice({price: addon.plan.price, hourly: true}),
      'Max Price': formatPrice({price: addon.plan.price, hourly: false}),
      Attachments: addon.attachments.map(function (att: Heroku.AddOnAttachment) {
        return [
          color.cyan(att.app?.name || ''), color.green(att.name || ''),
        ].join('::')
      })
        .sort(), 'Owning app': color.cyan(addon.app?.name ?? ''), 'Installed at': (new Date(addon.created_at ?? ''))
        .toString(), State: formatState(addon.state),
    })
  }
}
