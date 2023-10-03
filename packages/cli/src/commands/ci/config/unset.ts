import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import {getPipeline} from '../../../lib/ci/pipelines'
import {setPipelineConfigVars} from '../../../lib/api'

const validateArgs = (argv: any) => {
  if (argv.length === 0) {
    ux.error('Usage: heroku ci:config:unset KEY1 [KEY2 ...]\nMust specify KEY to unset.', {exit: 1})
  }
}

export default class CiConfigUnset extends Command {
  static description = 'unset CI config vars'
  static topic = 'ci'
  static examples = [
    '$ heroku ci:config:unset RAILS_ENV',
  ]

  static strict = false

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: false}),
    pipeline: flags.pipeline({required: false}),
  }

  static args = {
    key: Args.string({required: true}),
  }

  async run() {
    const {args, argv, flags} = await this.parse(CiConfigUnset)
    validateArgs(argv)

    const pipeline = await getPipeline(flags, this.heroku)

    const vars: Heroku.ConfigVars = {}
    vars[args.key] = ''

    await ux.action.start(`Unsetting ${args.key}`)

    setPipelineConfigVars(this.heroku, pipeline.id, vars)

    ux.action.stop()
  }
}
