import {Command} from '@heroku-cli/command'
import cli from 'cli-ux'

import disambiguate from '../../disambiguate'

export default class Open extends Command {
  static description = 'open a pipeline in dashboard'
  static examples = ['$ heroku pipelines:open example']
  static args = [{name: 'pipeline', description: 'name of pipeline', required: true}]

  async run() {
    const {args} = this.parse(Open)

    const pipeline: any = await disambiguate(this.heroku, args.pipeline)
    await cli.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`)
  }
}
