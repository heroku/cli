import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import disambiguate from '../../lib/pipelines/disambiguate.js'

export default class PipelinesDestroy extends Command {
  static args = {
    pipeline: Args.string({
      description: 'name of pipeline',
      required: true,
    }),
  }
  static description = 'destroy a pipeline'
  static examples = [
    color.command('heroku pipelines:destroy my-pipeline'),
  ]

  async run() {
    const {args} = await this.parse(PipelinesDestroy)
    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)

    ux.action.start(`Destroying ${color.pipeline(pipeline.name!)} pipeline`)
    const {platform} = new HerokuSDK()
    await platform.pipeline.delete(pipeline.id!)
    ux.action.stop()
  }
}
