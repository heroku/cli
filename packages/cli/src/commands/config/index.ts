import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import * as _ from 'lodash'

import {quote} from '../../lib/config/quote'

export class ConfigIndex extends Command {
  static description = 'display the config vars for an app'

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    shell: flags.boolean({char: 's', description: 'output config vars in shell format'}),
    json: flags.boolean({char: 'j', description: 'output config vars in json format'}),
  }

  async run() {
    const {flags} = await this.parse(ConfigIndex)
    const {body: config} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${flags.app}/config-vars`)
    if (flags.shell) {
      Object.entries(config)
        .forEach(([k, v]) => ux.log(`${k}=${quote(v)}`))
    } else if (flags.json) {
      hux.styledJSON(config)
    } else {
      hux.styledHeader(`${flags.app} Config Vars`)
      hux.styledObject(_.mapKeys(config, (_, k) => color.configVar(k)))
    }
  }
}
