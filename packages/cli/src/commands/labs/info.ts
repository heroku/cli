import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

function print(feature: Record<string, string>) {
  ux.styledHeader(feature.name)
  ux.styledObject({
    Description: feature.description,
    Enabled: feature.enabled ? color.green(feature.enabled) : color.red(feature.enabled),
    Docs: feature.doc_url,
  })
}

export default class LabsInfo extends Command {
  static description = 'show feature info'
  static topic = 'labs'

  static args = {
    feature: Args.string({required: true, description: 'Unique identifier of account feature or unique name of account feature.'}),
  }

  static flags = {
    app: flags.app({required: false}),
    remote: flags.remote(),
    json: flags.boolean({description: 'display as json', required: false}),
  }

  async run() {
    const {args, flags} = await this.parse(LabsInfo)
    let feature

    try {
      const featureResponse = await this.heroku.get<Heroku.AppFeature>(`/account/features/${args.feature}`)
      feature = featureResponse.body
    } catch (error: any) {
      if (error.http.statusCode !== 404) throw error
      // might be an app feature
      if (!flags.app) throw error
      const featureResponse = await this.heroku.get<Heroku.AppFeature>(`/apps/${flags.app}/features/${args.feature}`)
      feature = featureResponse.body
    }

    if (flags.json) {
      ux.styledJSON(feature)
    } else {
      print(feature)
    }
  }
}
