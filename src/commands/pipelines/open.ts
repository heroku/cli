import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import * as color from '@heroku/heroku-cli-util/color'
import {Args} from '@oclif/core'

import disambiguate from '../../lib/pipelines/disambiguate.js'

export default class Open extends Command {
  static args = {
    pipeline: Args.string({description: 'name of pipeline', required: true}),
  }
  static description = 'open a pipeline in dashboard'
  static examples = [color.command('heroku pipelines:open my-pipeline')]

  async run() {
    const {args} = await this.parse(Open)

    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)
    const url = `https://dashboard.heroku.com/pipelines/${pipeline.id}`
    if (!await hux.openUrl(url, {prompt: false})) this.exit(1)
  }
}
