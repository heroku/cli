import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import cli from 'heroku-cli-util')
import shellescape from 'shell-escape'
import api from '../../lib/heroku-api'
import Utils from '../../lib/utils'
import PipelineCompletion from '../../lib/completions'

export default class CiConfigGet extends Command {
  static description = 'get a CI config var'
  static flags = {
    pipeline: flags.string({char: 'p', description: 'pipeline', completion: PipelineCompletion}),
    shell: flags.string({char: 's', description: 'output config var in shell format'}),
  }

  static args = {
    key: Args.string({required: true}),
  }

  async run() {
    const {args, flags} = await this.parse(CiConfigGet)
    const pipeline = await Utils.getPipeline(context, heroku)
    const config = await api.configVars(heroku, pipeline.id)
    const value = config[args.key]

    if (flags.shell) {
      cli.log(`${args.key}=${shellescape([value])}`)
    } else {
      cli.log(value)
    }
  }
}

module.exports = {
  topic: 'ci',
  // wantsApp: true,
  // needsAuth: true,
  help: `Examples:

    $ heroku ci:config:get RAILS_ENV
    test
`,
  // args: [{
  //   name: 'key',
  // }],
  flags: [
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      completion: PipelineCompletion,
    },
  ],
  run: cli.command(run),
}
