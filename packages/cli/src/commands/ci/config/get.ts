
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {quote} from '../../../lib/config/quote.js'
import {getPipelineConfigVars} from '../../../lib/api.js'
import {getPipeline} from '../../../lib/ci/pipelines.js'

export default class CiConfigGet extends Command {
  static description = 'get a CI config var'
  static topic = 'ci'
  static examples = [
    `$ heroku ci:config:get --pipeline=PIPELINE RAILS_ENV
    test`,
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({exactlyOne: ['pipeline', 'app']}),
    shell: flags.boolean({char: 's', description: 'output config var in shell format'}),
  }

  static args = {
    key: Args.string({required: true, description: 'name of the config var key'}),
  }

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
