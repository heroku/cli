import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class Set extends Command {
  static aliases = ['drains:set']
  static args = {
    url: Args.string({description: 'URL to replace the log drain with', required: true}),
  }

  static description = 'replaces the log drain for a space'
  static flags = {
    space: flags.string({char: 's', description: 'space for which to set log drain', required: true}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Set)
    const {url} = args
    const {space} = flags
    const {body: drain} = await this.heroku.put<Heroku.LogDrain>(`/spaces/${space}/log-drain`, {
      body: {url},
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    })
    ux.stdout(`Successfully set drain ${color.cyan(drain.url)} for ${color.space(space)}.`)
    ux.warn('It may take a few moments for the changes to take effect.')
  }
}
