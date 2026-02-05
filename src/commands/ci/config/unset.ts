import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {setPipelineConfigVars} from '../../../lib/api.js'
import {getPipeline} from '../../../lib/ci/pipelines.js'
import {validateArgvPresent} from '../../../lib/ci/validate.js'

export default class CiConfigUnset extends Command {
  static description = 'unset CI config vars'
  static examples = [
    color.command('heroku ci:config:unset RAILS_ENV'),
  ]

  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({exactlyOne: ['pipeline', 'app']}),
    remote: flags.remote(),
  }

  static strict = false

  static topic = 'ci'

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
