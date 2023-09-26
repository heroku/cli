import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as shellescape from 'shell-escape'
import {getConfigVars} from '../../../lib/api'
import {getPipeline} from '../../../lib/ci/pipelines'

export default class CiConfigGet extends Command {
  static description = 'get a CI config var'
  static topic = 'ci'
  static examples = [
    `$ heroku ci:config:get --pipeline=PIPELINE RAILS_ENV
    test`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: false}),
    pipeline: flags.pipeline({required: false}),
    shell: flags.boolean({char: 's', description: 'output config var in shell format'}),
  }

  static args = {
    key: Args.string({required: true}),
  }

  async run() {
    const {args, flags} = await this.parse(CiConfigGet)
    const pipeline = await getPipeline(flags, this)
    const {body: config} = await getConfigVars(this.heroku, pipeline.id)
    const value = config[args.key]

    if (flags.shell) {
      ux.log(`${args.key}=${shellescape([value])}`)
    } else {
      ux.log((value !== null && value !== undefined) ? value : 'undefined')
    }
  }
}
