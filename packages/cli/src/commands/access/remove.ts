import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class AccessRemove extends Command {
  static description = 'remove users from a team app'
  static example = '$ heroku access:remove user@email.com --app APP'
  static topic = 'access'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote({char: 'r'}),
  }

  static strict = false

  public async run(): Promise<void> {
    const {flags, argv} = await this.parse(AccessRemove)
    const {app} = flags
    const email = argv[0] as string
    const appName = app
    ux.action.start(`Removing ${color.cyan(email)} access from the app ${color.magenta(appName)}`)
    await this.heroku.delete<Heroku.Collaborator>(`/apps/${appName}/collaborators/${email}`)
    ux.action.stop()
  }
}
