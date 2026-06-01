import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

export default class Pipelines extends Command {
  static description = 'list pipelines you have access to'
  static examples = [
    color.command('heroku pipelines'),
  ]
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(Pipelines)

    const {platform} = new HerokuSDK()
    const pipelines = await platform.pipeline.list()

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
