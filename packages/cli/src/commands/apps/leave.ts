import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Leave extends Command {
  static topic = 'apps'
  static aliases = ['leave'];
  static description = 'remove yourself from a team app'
  static example = 'heroku apps:leave -a APP'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Leave)
    const {app} = flags
    const request = await this.heroku.get<Heroku.Account>('/account')
    ux.action.start(`Leaving ${color.cyan(app)}`)
    const {body: account} = request
    await this.heroku.delete(`/apps/${app}/collaborators/${encodeURIComponent(account.email as string)}`)
    ux.action.stop()
  }
}
