import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags, Command} from '@heroku-cli/command'

export default class Features extends Command {
  static description = 'list available app features'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(Features)
    const {app, json} = flags

    let {body: features} = await this.heroku.get<Heroku.AppFeature[]>(`/apps/${app}/features`)
    features = features.filter(f => f.state === 'general')
    features = features.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    if (json) {
      hux.styledJSON(features)
    } else {
      hux.styledHeader(`App Features ${color.app(app)}`)
      const longest = Math.max.apply(null, features.map(f => f.name?.length || 0))

      for (const f of features) {
        let line = `${f.enabled ? '[+]' : '[ ]'} ${f.name?.padEnd(longest)}`
        if (f.enabled) line = color.green(line)
        line = `${line}  ${f.description}`
        ux.stdout(line)
      }
    }
  }
}
