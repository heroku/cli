import {Command, flags} from '@heroku-cli/command'
import type {AppFeature} from '@heroku/types/3.sdk'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

export default class Features extends Command {
  static description = 'list available app features'
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'output in json format'}),
    remote: flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(Features)
    const {app, json} = flags

    const {platform} = new HerokuSDK()
    let features = await platform.appFeature.list(app) as AppFeature[]
    features = features.filter(f => f.state === 'general')
    features = features.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    if (json) {
      hux.styledJSON(features)
    } else {
      hux.styledHeader(`App Features ${color.app(app)}`)
      const longest = Math.max.apply(null, features.map(f => f.name?.length || 0))

      for (const f of features) {
        let line = `${f.enabled ? '[+]' : '[ ]'} ${f.name?.padEnd(longest)}`
        if (f.enabled) line = color.success(line)
        line = `${line}  ${f.description}`
        ux.stdout(line)
      }
    }
  }
}
