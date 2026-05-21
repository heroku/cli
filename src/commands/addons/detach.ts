import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {createPlatformClient} from '@heroku/sdk/platform'
import {Args, ux} from '@oclif/core'

export default class Detach extends Command {
  static args = {
    attachment_name: Args.string({description: 'unique identifier of the add-on attachment', required: true}),
  }
  static description = 'detach an existing add-on resource from an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'addons'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Detach)
    const {app} = flags
    const platform = createPlatformClient()
    const attachment = await platform.addOnAttachment.infoByApp(app, args.attachment_name)

    ux.action.start(`Detaching ${color.attachment(attachment.name || '')} to ${color.addon(attachment.addon?.name || '')} from ${color.app(app)}`)

    await platform.addOnAttachment.delete(attachment.id!)

    ux.action.stop()

    ux.action.start(`Unsetting ${color.attachment(attachment.name || '')} config vars and restarting ${color.app(app)}`)

    const releases = await platform
      .withHeaders({Range: 'version ..; max=1, order=desc'})
      .release.list(app)

    ux.action.stop(`done, v${releases[0]?.version || ''}`)
  }
}
