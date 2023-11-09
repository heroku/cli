import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags, Command} from '@heroku-cli/command'
import {sortBy} from 'lodash'

export default class Features extends Command {
  static description = 'list available app features'
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'output in json format'}),

  }

  async run() {
    const {flags} = await this.parse(Features)
    const {app, json} = flags

    let {body: features} = await this.heroku.get<Heroku.AppFeature[]>(`/apps/${app}/features`)
    features = features.filter(f => f.state === 'general')
    features = sortBy(features, 'name')

    if (json) {
      ux.styledJSON(features)
    } else {
      ux.styledHeader(`App Features ${color.app(app)}`)
      const longest = Math.max.apply(null, features.map(f => f.name?.length || 0))

      for (const f of features) {
        let line = `${f.enabled ? '[+]' : '[ ]'} ${f.name?.padEnd(longest)}`
        if (f.enabled) line = color.green(line)
        line = `${line}  ${f.description}`
        ux.log(line)
      }
    }
  }
}

