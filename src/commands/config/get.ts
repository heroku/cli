import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args} from '@oclif/core'

import {quote} from '../../lib/config/quote.js'

export class ConfigGet extends Command {
  static args = {
    KEY: Args.string({description: 'key name of the config var value', required: true}),
  }
  static description = 'display a single config value for an app'
  static example = `${color.command(`heroku config:get RAILS_ENV
production`)}`
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    remote: flags.remote(),
    shell: flags.boolean({char: 's', description: 'output config vars in shell format'}),
  }
  static strict = false
  static usage = 'config:get KEY...'

  async run() {
    const {platform} = new HerokuSDK()
    const {argv, flags} = await this.parse(ConfigGet)
    const config = await platform.configVar.infoForApp(flags.app)

    if (flags.json) {
      const results = (argv as string[]).map(key => {
        const exists = key in config
        return {
          key,
          value: exists ? config[key] : null,
        }
      })

      if (results.length === 1) {
        hux.styledJSON(results[0])
      } else {
        hux.styledJSON(results)
      }
    } else if (flags.shell) {
      for (const key of (argv as string[])) {
        const v = config[key]
        this.log(`${key}=${quote(v || '')}`)
      }
    } else {
      for (const key of (argv as string[])) {
        const v = config[key]
        this.log(v || '')
      }
    }
  }
}
