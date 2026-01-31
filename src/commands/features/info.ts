import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'

export default class Info extends Command {
  static args = {
    feature: Args.string({description: 'unique identifier or name of the app feature', required: true}),
  }

  static description = 'display information about a feature'

  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'output in json format'}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(Info)

    const {app, json} = flags
    const {body: feature} = await this.heroku.get<Heroku.AppFeature>(`/apps/${app}/features/${args.feature}`)

    if (json) {
      hux.styledJSON(feature)
    } else {
      hux.styledHeader(feature.name || '')
      /* eslint-disable perfectionist/sort-objects */
      hux.styledObject({
        Description: feature.description,
        Enabled: feature.enabled ? color.success('true') : color.failure('false'),
        Docs: feature.doc_url,
      })
      /* eslint-enable perfectionist/sort-objects */
    }
  }
}
