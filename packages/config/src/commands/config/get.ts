import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import {quote} from '../../quote'

export class ConfigGet extends Command {
  static usage = 'config:get KEY...'

  static description = 'display a single config value for an app'

  static example = `$ heroku config:get RAILS_ENV
production`

  static strict = false

  static args = [{name: 'KEY', required: true}]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    shell: flags.boolean({char: 's', description: 'output config vars in shell format'}),
  }

  async run() {
    const {flags, argv} = await this.parse(ConfigGet)
    const {body: config} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${flags.app}/config-vars`)
    for (const key of argv) {
      const v = config[key]
      if (flags.shell) {
        this.log(`${key}=${quote(v || '')}`)
      } else {
        this.log(v || '')
      }
    }
  }
}
