import {Command, flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {confirmCommand} from '@heroku/heroku-cli-util/hux'
import {AddonResolver} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'

import {OBJECT_STORE_ADDON_SERVICE} from '../../../lib/object-store/addon.js'

export default class ObjectStoreAttachmentsDestroy extends Command {
  static args = {
    attachment_name: Args.string({
      description: 'unique identifier of the object store attachment',
      required: true,
    }),
  }
  static description = 'detach an existing object store attachment from an app'
  static examples = [
    '<%= config.bin %> <%= command.id %> REPORTS --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ObjectStoreAttachmentsDestroy)
    const {attachment_name: attachmentName} = args
    const {app, confirm} = flags
    const {body: attachment} = await this.heroku.get<Required<Heroku.AddOnAttachment>>(`/apps/${app}/addon-attachments/${attachmentName}`)
    const addonResolver = new AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(attachment.addon.name, undefined, OBJECT_STORE_ADDON_SERVICE)

    await confirmCommand({comparison: app, confirmation: confirm})

    try {
      ux.action.start(`Detaching ${color.attachment(attachmentName)} on ${color.addon(addon.name)} from ${color.app(app)}`)
      await this.heroku.delete(`/addon-attachments/${attachment.id}`)
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }

    try {
      ux.action.start(`Unsetting ${color.attachment(attachmentName)} config vars and restarting ${color.app(app)}`)
      const {body: releases} = await this.heroku.get<Required<Heroku.Release>[]>(`/apps/${app}/releases`, {
        headers: {Range: 'version ..; max=1, order=desc'}, partial: true,
      })
      ux.action.stop(`done, v${releases[0].version}`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
