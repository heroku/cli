import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

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
    const {platform} = new HerokuSDK()
    const {flags} = await this.parse(ConfigIndex)
    const config = await platform.configVar.infoForApp(flags.app)
    if (flags.shell) {
      for (const [k, v] of Object.entries(config)) ux.stdout(`${k}=${quote(v)}`)
    } else if (flags.json) {
      hux.styledJSON(config)
    } else {
      hux.styledHeader(`${color.app(flags.app)} Config Vars`)
      const coloredConfig = Object.fromEntries(Object.entries(config).map(([key, value]) => [color.name(key), value]))
      hux.styledObject(coloredConfig)
    }
  }
}
