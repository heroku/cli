import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {getPipeline} from '../../../lib/ci/pipelines'
import {setPipelineConfigVars} from '../../../lib/api'
import {validateArgvPresent} from '../../../lib/ci/validate'

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
    remote: flags.remote(),
    pipeline: flags.pipeline({required: false}),
  }

  async run() {
    const {argv, flags} = await this.parse(CiConfigUnset)
    const isUnset = true
    validateArgvPresent(argv, isUnset)

    const pipeline = await getPipeline(flags, this.heroku)

    const vars: Record<string, null> = {}

    for (const str of argv) {
      const iAmStr: string = str as string
      vars[iAmStr] = null
    }

    await ux.action.start(`Unsetting ${Object.keys(vars).join(', ')}`)

    setPipelineConfigVars(this.heroku, pipeline.id, vars)

    ux.action.stop()
  }
}
