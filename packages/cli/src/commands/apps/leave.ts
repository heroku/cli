import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class Leave extends Command {
  static aliases = ['leave']
  static description = 'remove yourself from a team app'
  static example = 'heroku apps:leave -a APP'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'apps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Leave)
    const {app} = flags
    const request = await this.heroku.get<Heroku.Account>('/account')
    ux.action.start(`Leaving ${color.app(app)}`)
    const {body: account} = request
    await this.heroku.delete(`/apps/${app}/collaborators/${encodeURIComponent(account.email as string)}`)
    ux.action.stop()
  }
}
