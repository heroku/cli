import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {trapConfirmationRequired} from '../../lib/addons/util.js'

export default class Attach extends Command {
  static args = {
    addon_name: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
  }

  static description = 'attach an existing add-on resource to an app'

  static flags = {
    app: flags.app({required: true}),
    as: flags.string({description: 'name for add-on attachment'}),
    confirm: flags.string({description: 'overwrite existing add-on attachment with same name'}),
    credential: flags.string({description: 'credential name for scoped access to Heroku Postgres'}),
    remote: flags.remote(),
  }

  static topic = 'addons'

  public async run(): Promise<void> {
    const {args,  flags} = await this.parse(Attach)
    const {app, as, confirm, credential} = flags
    const {body: addon} = await this.heroku.get<Heroku.AddOn>(`/addons/${encodeURIComponent(args.addon_name)}`)
    const createAttachment = async (confirmed?: string) =>  {
      let namespace: string | undefined
      if (credential && credential !== 'default') {
        namespace = 'credential:' + credential
      }

      const body = {
        addon: {name: addon.name}, app: {name: app}, confirm: confirmed, name: as, namespace,
      }

      ux.action.start(`Attaching ${credential ? color.name(credential) + ' of ' : ''}${color.addon(addon.name || '')}${as ? ' as ' + color.attachment(as) : ''} to ${color.app(app)}`)
      const {body: attachments} = await this.heroku.post<Heroku.AddOnAttachment>('/addon-attachments', {body})
      ux.action.stop()
      return attachments
    }

    if (credential && credential !== 'default') {
      const {body: credentialConfig} = await this.heroku.get<Heroku.AddOnConfig[]>(`/addons/${addon.name}/config/credential:${encodeURIComponent(credential)}`)
      if (credentialConfig.length === 0) {
        throw new Error(`Could not find credential ${color.name(credential)} for database ${(addon.name || '')}`)
      }
    }

    const attachment = await trapConfirmationRequired<Heroku.AddOnAttachment>(app, confirm, (confirmed?: string) => createAttachment(confirmed))
    ux.action.start(`Setting ${color.attachment(attachment.name || '')} config vars and restarting ${color.app(app)}`)
    const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
      headers: {Range: 'version ..; max=1, order=desc'}, partial: true,
    })
    ux.action.stop(`done, v${releases[0].version}`)
  }
}
