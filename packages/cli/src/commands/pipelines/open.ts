import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'
const open = require('open')

import disambiguate from '../../lib/pipelines/disambiguate'

export default class Open extends Command {
  static description = 'open a pipeline in dashboard'

  static examples = ['$ heroku pipelines:open my-pipeline']

  static args = {
    pipeline: Args.string({description: 'name of pipeline', required: true}),
  }

  async run() {
    const {args} = await this.parse(Open)

    const pipeline: any = await disambiguate(this.heroku, args.pipeline)
    await open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`)
  }
}
