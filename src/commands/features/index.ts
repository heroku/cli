import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color, hux} from '@heroku/heroku-cli-util'
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
        if (f.enabled) line = color.success(line)
        line = `${line}  ${f.description}`
        ux.stdout(line)
      }
    }
  }
}
