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

export default class LabsIndex extends Command {
  static description = 'show feature info'
  static topic = 'labs'

  static args = {
    feature: Args.string({required: true}),
  }

  static flags = {
    app: flags.string({char: 'a', description: 'app name'}),
    json: flags.boolean({description: 'output in json format', required: false}),
  }

  async run() {
    const {args, flags} = await this.parse(LabsIndex)
    let feature

    try {
      const featureResponse = await this.heroku.get<Heroku.AppFeature>(`/account/features/${args.feature}`)
      feature = featureResponse.body
    } catch (error: any) {
      if (error.statusCode !== 404) throw error
      // might be an app feature
      if (!flags.app) throw error
      const featureResponse = await this.heroku.get<Heroku.AppFeature>(`/apps/${flags.app}/features/${flags.args.feature}`)
      feature = featureResponse.body
    }

    if (flags.json) {
      ux.styledJSON(feature)
    } else {
      print(feature)
    }
  }
}
