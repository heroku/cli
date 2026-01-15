import {hux, color as newColor} from '@heroku/heroku-cli-util'
import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {quote} from '../../lib/config/quote.js'

export class ConfigIndex extends Command {
  static description = 'display the config vars for an app'

  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({char: 'j', description: 'output config vars in json format'}),
    remote: flags.remote(),
    shell: flags.boolean({char: 's', description: 'output config vars in shell format'}),
  }

  async run() {
    const {flags} = await this.parse(ConfigIndex)
    const {body: config} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${flags.app}/config-vars`)
    if (flags.shell) {
      Object.entries(config)
        .forEach(([k, v]) => ux.stdout(`${k}=${quote(v)}`))
    } else if (flags.json) {
      hux.styledJSON(config)
    } else {
      hux.styledHeader(`${newColor.app(flags.app)} Config Vars`)
      const coloredConfig = Object.fromEntries(
        Object.entries(config).map(([key, value]) => [color.configVar(key), value]),
      )
      hux.styledObject(coloredConfig)
    }
  }
}
