import {Command, flags as cmdFlags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import * as shellescape from 'shell-escape'

import {getPipeline} from '../../../lib/ci/pipelines'
import {getPipelineConfigVars} from '../../../lib/api'

export default class CiConfig extends Command {
  static description = 'display CI config vars'

  static examples = [
    `$ heroku ci:config --app murmuring-headland-14719 --json
`,
  ]

  static flags = {
    app: cmdFlags.app(),
    remote: cmdFlags.remote(),
    shell: cmdFlags.boolean({char: 's', description: 'output config vars in shell format'}),
    json: cmdFlags.boolean({description: 'output config vars in json format'}),
    pipeline: cmdFlags.pipeline({exactlyOne: ['pipeline', 'app']}),
  }

  async run() {
    const {flags} = await this.parse(CiConfig)
    const pipeline = await getPipeline(flags, this.heroku)
    const {body: config} = await getPipelineConfigVars(this.heroku, pipeline.id)

    if (flags.shell) {
      Object.keys(config).forEach(key => {
        ux.log(`${key}=${shellescape([config[key]])}`)
      })
    } else if (flags.json) {
      hux.styledJSON(config)
    } else {
      hux.styledHeader(`${pipeline.name} test config vars`)
      const formattedConfig: Heroku.Pipeline = {}
      Object.keys(config).forEach(key => {
        formattedConfig[color.green(key)] = config[key]
      })
      hux.styledObject(formattedConfig)
    }
  }
}
