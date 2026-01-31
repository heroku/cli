import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class Get extends Command {
  static aliases = ['drains:get']
  static description = 'display the log drain for a space'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space for which to get log drain', required: true}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Get)
    const {json, space} = flags
    const {body: drain} = await this.heroku.get<Required<Heroku.LogDrain>>(
      `/spaces/${space}/log-drain`,
      {headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'}},
    )

    if (json) {
      ux.stdout(JSON.stringify(drain, null, 2))
    } else {
      ux.stdout(`${color.info(drain.url)} (${color.name(drain.token)})`)
    }
  }
}
