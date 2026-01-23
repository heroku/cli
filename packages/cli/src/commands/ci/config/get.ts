import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {getPipelineConfigVars} from '../../../lib/api.js'
import {getPipeline} from '../../../lib/ci/pipelines.js'
import {quote} from '../../../lib/config/quote.js'

export default class CiConfigGet extends Command {
  static args = {
    key: Args.string({description: 'name of the config var key', required: true}),
  }

  static description = 'get a CI config var'
  static examples = [
    color.command('heroku ci:config:get --pipeline=PIPELINE RAILS_ENV test'),
  ]

  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({exactlyOne: ['pipeline', 'app']}),
    remote: flags.remote(),
    shell: flags.boolean({char: 's', description: 'output config var in shell format'}),
  }

  static topic = 'ci'

  async run() {
    const {args, flags} = await this.parse(CiConfigGet)
    const pipeline = await getPipeline(flags, this.heroku)
    const {body: config} = await getPipelineConfigVars(this.heroku, pipeline.id)
    const value = config[args.key]

    if (flags.shell) {
      ux.stdout(`${args.key}=${quote(value)}`)
    } else {
      ux.stdout((value !== null && value !== undefined) ? value : 'undefined')
    }
  }
}
