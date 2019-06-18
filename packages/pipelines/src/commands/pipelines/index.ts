import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import cli from 'cli-ux'

export default class Pipelines extends Command {
  static description = 'list pipelines you have access to'

  static examples = [
    `$ heroku pipelines
=== My Pipelines
example
sushi`
  ]

  static flags = {
    json: flags.boolean({description: 'output in json format'})
  }

  async run() {
    const {flags} = this.parse(Pipelines)

    let {body: pipelines} = await this.heroku.get<Heroku.Pipeline[]>('/pipelines')

    if (flags.json) {
      cli.styledJSON(pipelines)
    } else {
      cli.styledHeader('My Pipelines')
      for (let pipeline of pipelines) {
        cli.log(pipeline.name)
      }
    }
  }
}
