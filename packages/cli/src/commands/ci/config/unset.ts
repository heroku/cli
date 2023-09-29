import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {getPipeline} from '../../../lib/ci/pipelines'
import {setConfigVars} from '../../../lib/ci/heroku-api'

export default class CiConfigUnset extends Command {
  static description = 'unset CI config vars'
  static topic = 'ci'
  static examples = [
    '$ heroku ci:config:unset RAILS_ENV',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: false}),
    pipeline: flags.pipeline({required: false}),
  }

  static args = {
    key: Args.string({required: true}),
  }

  async run() {
    const {args, flags} = await this.parse(CiConfigUnset)
    const pipeline = await getPipeline(flags, this)

    const vars: Record<string, null> = {}
    vars[args.key] = null

    await ux.action.start(`Unsetting ${args.key}`)

    setConfigVars(this, pipeline.id, vars)

    ux.action.stop()
  }
}
