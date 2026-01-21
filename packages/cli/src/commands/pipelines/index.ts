import {color, hux} from '@heroku/heroku-cli-util'
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
      hux.styledJSON(pipelines)
    } else {
      hux.styledHeader('My Pipelines')
      for (const pipeline of pipelines) {
        ux.stdout(color.pipeline(pipeline.name || ''))
      }
    }
  }
}
