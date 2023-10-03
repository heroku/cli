import {ux} from '@oclif/core'
import {ParserOutput} from '@oclif/core/lib/interfaces/parser'
import {getPipeline} from '../../../lib/ci/pipelines'
import {Command, flags} from '@heroku-cli/command'
import {setPipelineConfigVars} from '../../../lib/api'
import color from '@heroku-cli/color'

function validateInput(str: string) {
  if (!str.includes('=')) {
    ux.error(`${color.cyan(str)} is invalid. Must be in the format ${color.cyan('FOO=bar')}.`, {exit: 1})
  }

  return true
}

function validateArgs(argv: ParserOutput['argv']) {
  if (argv.length === 0) {
    ux.error('Usage: heroku ci:config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.', {exit: 1})
  }
}

export default class CiConfigSet extends Command {
  static description = 'set CI config vars'

  static topic = 'ci'

  static examples = [
    `$ heroku ci:config:set --pipeline PIPELINE RAILS_ENV=test
    Setting test config vars... done
    RAILS_ENV: test`,
  ]

  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({required: true}),
  }

  static strict = false

  async run() {
    const {argv, flags} = await this.parse(CiConfigSet)
    validateArgs(argv)

    const vars: Record<string, string> = {}

    for (const str of argv) {
      const iAmStr: string = str as string
      validateInput(iAmStr)
      const [key, value] = iAmStr.split('=')
      vars[key] = value
    }

    const pipeline = await getPipeline(flags, this.heroku)

    ux.action.start(`Setting ${Object.keys(vars).join(', ')}`)
    await setPipelineConfigVars(this.heroku, pipeline.id, vars)
    ux.action.stop()

    ux.styledObject(
      Object.keys(vars).reduce((memo: Record<string, string>, key: string) => {
        memo[color.green(key)] = vars[key]
        return memo
      }, {}),
    )
  }
}
