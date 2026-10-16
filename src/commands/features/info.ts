import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

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
    const {platform} = createSDK(this.heroku)
    const {args, flags} = await this.parse(Info)

    const {app, json} = flags
    const feature = await platform.appFeature.info(app, args.feature)

    if (json) {
      hux.styledJSON(feature)
    } else {
      hux.styledHeader(feature.name || '')
      hux.styledObject({
        Description: feature.description,
        Docs: feature.doc_url,
        Enabled: feature.enabled ? color.success('true') : color.failure('false'),
      })
    }
  }
}
