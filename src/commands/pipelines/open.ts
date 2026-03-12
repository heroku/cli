import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import open from 'open'

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
    ux.stdout(`Opening ${color.info(url)}...`)
    await open(url)
  }
}
