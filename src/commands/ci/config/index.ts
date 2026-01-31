import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags as cmdFlags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {getPipelineConfigVars} from '../../../lib/api.js'
import {getPipeline} from '../../../lib/ci/pipelines.js'
import {quote} from '../../../lib/config/quote.js'

export default class CiConfig extends Command {
  static description = 'display CI config vars'

  static examples = [
    color.command(`heroku ci:config --app murmuring-headland-14719 --json
`),
  ]

  static flags = {
    app: cmdFlags.app(),
    json: cmdFlags.boolean({description: 'output config vars in json format'}),
    pipeline: cmdFlags.pipeline({exactlyOne: ['pipeline', 'app']}),
    remote: cmdFlags.remote(),
    shell: cmdFlags.boolean({char: 's', description: 'output config vars in shell format'}),
  }

  async run() {
    const {flags} = await this.parse(CiConfig)
    const pipeline = await getPipeline(flags, this.heroku)
    const {body: config} = await getPipelineConfigVars(this.heroku, pipeline.id)

    if (flags.shell) {
      Object.keys(config).forEach(key => {
        ux.stdout(`${key}=${quote(config[key])}`)
      })
    } else if (flags.json) {
      hux.styledJSON(config)
    } else {
      hux.styledHeader(`${color.pipeline(pipeline.name)} test config vars`)
      const formattedConfig: Heroku.Pipeline = {}
      Object.keys(config).forEach(key => {
        formattedConfig[color.green(key)] = config[key]
      })
      hux.styledObject(formattedConfig)
    }
  }
}
