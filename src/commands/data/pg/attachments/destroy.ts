import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/baseCommand.js'

export default class DataPgAttachmentsDestroy extends BaseCommand {
  static args = {
    attachment_name: Args.string({
      description: 'unique identifier of the database attachment',
      required: true,
    }),
  }

  static description = 'detach an existing database attachment from an app'

  static flags = {
    app: Flags.app({required: true}),
    confirm: Flags.string({hidden: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgAttachmentsDestroy)
    const {attachment_name: attachmentName} = args
    const {app, confirm} = flags
    const {body: attachment} = await this.heroku.get<Required<Heroku.AddOnAttachment>>(
      `/apps/${app}/addon-attachments/${attachmentName}`,
    )
    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(attachment.addon.name, app, utils.pg.addonService())

    if (!utils.pg.isAdvancedDatabase(addon)) {
      ux.error(
        'You can only use this command on Advanced-tier databases.\n'
          + `Use ${color.code(`heroku addons:detach ${attachmentName} -a ${app}`)} instead.`,
      )
    }

    await hux.confirmCommand({comparison: app, confirmation: confirm})

    try {
      ux.action.start(
        `Detaching ${color.attachment(attachmentName)} on ${color.datastore(addon.name)} from ${color.app(app)}`,
      )
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
