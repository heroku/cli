import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Get extends Command {
  static aliases = ['drains:get']
  static topic = 'drains'
  static hidden = true
  static description = 'display the log drain for a space'
  static flags = {
    space: flags.string({char: 's', description: 'space for which to get log drain', required: true}),
    json: flags.boolean({description: 'output in json format'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Get)
    const {space, json} = flags
    const {body: drain} = await this.heroku.get<Required<Heroku.LogDrain>>(
      `/spaces/${space}/log-drain`,
      {headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'}},
    )

    if (json) {
      ux.log(JSON.stringify(drain, null, 2))
    } else {
      ux.log(`${color.cyan(drain.url)} (${color.green(drain.token)})`)
    }
  }
}
