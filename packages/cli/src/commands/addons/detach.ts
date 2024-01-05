import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Detach extends Command {
  static topic = 'addons'
  static description = 'detach an existing add-on resource from an app'
  static flags = {
    app: flags.app({required: true}),
  }

  static args = {
    attachment_name: Args.string({required: true}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Detach)
    const app = flags.app
    const {body: attachment} = await this.heroku.get<Heroku.AddOnAttachment>(`/apps/${app}/addon-attachments/${args.attachment_name}`)

    ux.action.start(`Detaching ${color.cyan(attachment.name || '')} to ${color.yellow(attachment.addon?.name || '')} from ${color.magenta(app)}`)

    await this.heroku.delete(`/addon-attachments/${attachment.id}`)

    ux.action.stop()

    ux.action.start(`Unsetting ${color.cyan(attachment.name || '')} config vars and restarting ${color.magenta(app)}`)

    const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
      partial: true, headers: {Range: 'version ..; max=1, order=desc'},
    })

    ux.action.stop(`done, v${releases[0]?.version || ''}`)
  }
}
