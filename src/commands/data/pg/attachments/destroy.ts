import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
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
    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    try {
      const {releaseVersion} = await data.postgresDatabase.deleteAttachment(app, attachmentName, {
        async beforeDelete({addon}) {
          await hux.confirmCommand({comparison: app, confirmation: confirm})
          ux.action.start(`Detaching ${color.attachment(attachmentName)} on ${color.datastore(addon.name)} from ${color.app(app)}`)
        },
        onDetached() {
          ux.action.stop()
          ux.action.start(`Unsetting ${color.attachment(attachmentName)} config vars and restarting ${color.app(app)}`)
        },
      })
      ux.action.stop(`done, v${releaseVersion}`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      if (error instanceof NotAdvancedDatabaseError) {
        ux.error('You can only use this command on Advanced-tier databases.\n'
            + `Use ${color.code(`heroku addons:detach ${attachmentName} -a ${app}`)} instead.`)
      }

      throw error
    }
  }
}
