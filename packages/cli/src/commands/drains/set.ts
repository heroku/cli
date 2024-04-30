import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Set extends Command {
  static topic = 'drains'
  static hidden = true
  static description = 'replaces the log drain for a space'
  static flags = {
    space: flags.string({char: 's', description: 'space for which to set log drain', required: true}),
  }

  static args = {
    url: Args.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Set)
    const {url} = args
    const {space} = flags
    const {body: drain} = await this.heroku.put<Heroku.LogDrain>(`/spaces/${space}/log-drain`, {
      body: {url},
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    })
    ux.log(`Successfully set drain ${color.cyan(drain.url)} for ${color.cyan.bold(space)}.`)
    ux.warn('It may take a few moments for the changes to take effect.')
  }
}
