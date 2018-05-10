import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import ux from 'cli-ux'
import * as _ from 'lodash'

import {quote} from '../../quote'

type Config = {[k: string]: string}

export class ConfigIndex extends Command {
  static description = 'display the config vars for an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    shell: flags.boolean({char: 's', description: 'output config vars in shell format'}),
    json: flags.boolean({char: 'j', description: 'output config vars in json format'}),
  }

  async run() {
    const {flags} = this.parse(ConfigIndex)
    const {body: config}: {body: Config} = await this.heroku.get(`/apps/${flags.app}/config-vars`)
    if (flags.shell) {
      Object.entries(config)
      .forEach(([k, v]) => ux.log(`${k}=${quote(v)}`))
    } else if (flags.json) {
      ux.styledJSON(config)
    } else {
      ux.styledHeader(`${flags.app} Config Vars`)
      ux.styledObject(_.mapKeys(config, (_, k) => color.configVar(k)))
    }
  }
}
