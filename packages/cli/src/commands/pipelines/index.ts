import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class Pipelines extends Command {
  static description = 'list pipelines you have access to'

  static examples = [
    '$ heroku pipelines',
  ]

  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(Pipelines)

    const {body: pipelines} = await this.heroku.get<Heroku.Pipeline[]>('/pipelines')

    if (flags.json) {
      ux.styledJSON(pipelines)
    } else {
      ux.styledHeader('My Pipelines')
      for (const pipeline of pipelines) {
        ux.log(pipeline.name)
      }
    }
  }
}
