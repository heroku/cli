import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {addOnExtensions} from '@heroku/sdk/extensions/platform'
import {getPostgresServiceName, isAdvancedDatabase} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../../lib/data/base-command.js'
import {createSDK} from '../../../../lib/sdk.js'

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
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgAttachmentsDestroy)
    const {attachment_name: attachmentName} = args
    const {app, confirm} = flags
    const {platform} = createSDK(this.heroku, {extensions: [addOnExtensions]})

    const attachment = await platform.addOnAttachment.infoByApp(app, attachmentName)
    const addon = await platform.addOn.resolve(attachment.addon.name, {
      addonService: getPostgresServiceName(),
    })

    if (!isAdvancedDatabase(addon)) {
      ux.error('You can only use this command on Advanced-tier databases.\n'
          + `Use ${color.code(`heroku addons:detach ${attachmentName} -a ${app}`)} instead.`)
    }

    await hux.confirmCommand({comparison: app, confirmation: confirm})

    try {
      ux.action.start(`Detaching ${color.attachment(attachmentName)} on ${color.datastore(addon.name)} from ${color.app(app)}`)
      await platform.addOnAttachment.delete(attachment.id)
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }

    try {
      ux.action.start(`Unsetting ${color.attachment(attachmentName)} config vars and restarting ${color.app(app)}`)
      const releases = await platform
        .withHeaders({Range: 'version ..; max=1, order=desc'})
        .release.list(app)
      ux.action.stop(`done, v${releases[0].version}`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
