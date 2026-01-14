import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
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
    const {body: attachment} = await this.heroku.get<Heroku.AddOnAttachment>(`/apps/${app}/addon-attachments/${args.attachment_name}`)

    ux.action.start(`Detaching ${color.cyan(attachment.name || '')} to ${color.yellow(attachment.addon?.name || '')} from ${color.app(app)}`)

    await this.heroku.delete(`/addon-attachments/${attachment.id}`)

    ux.action.stop()

    ux.action.start(`Unsetting ${color.cyan(attachment.name || '')} config vars and restarting ${color.app(app)}`)

    const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
      headers: {Range: 'version ..; max=1, order=desc'}, partial: true,
    })

    ux.action.stop(`done, v${releases[0]?.version || ''}`)
  }
}
