import {Args, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags, Command} from '@heroku-cli/command'

export default class Info extends Command {
  static description = 'display information about a feature'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    json: flags.boolean({description: 'output in json format'}),
  }

  static args = {
    feature: Args.string({required: true, description: 'Unique identifier of app feature or unique name of app feature.'}),
  }

  async run() {
    const {flags, args} = await this.parse(Info)

    const {app, json} = flags
    const {body: feature} = await this.heroku.get<Heroku.AppFeature>(`/apps/${app}/features/${args.feature}`)

    if (json) {
      ux.styledJSON(feature)
    } else {
      ux.styledHeader(feature.name || '')
      ux.styledObject({
        Description: feature.description,
        Enabled: feature.enabled ? color.green('true') : color.red('false'),
        Docs: feature.doc_url,
      })
    }
  }
}

