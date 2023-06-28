import {Command, flags} from '@heroku-cli/command'
import Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

const cli = CliUx.ux

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
      cli.styledJSON(pipelines)
    } else {
      cli.styledHeader('My Pipelines')
      for (const pipeline of pipelines) {
        cli.log(pipeline.name)
      }
    }
  }
}
