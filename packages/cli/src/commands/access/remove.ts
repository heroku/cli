import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Remove extends Command {
  static description = 'remove users from a team app'
  static example = '$ heroku access:remove user@email.com --app APP'
  static topic = 'access'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote({char: 'r'}),
  }
  public async run(): Promise<void> {
    const {flags, argv, args} = await this.parse(Remove)
    const {app} = flags
    let appName = app
    let request = this.heroku.delete(`/apps/${appName}/collaborators/${args.email}`)
    await ux.action(`Removing ${color.cyan(args.email)} access from the app ${color.magenta(appName)}`, request)
  }
}
