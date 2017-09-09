// @flow

import {Command, flags} from 'cli-engine-heroku'

export default class LabsDisable extends Command {
  static topic = 'labs'
  static command = 'disable'
  static description = 'disables an experimental feature'
  static args = [{name: 'feature'}]
  static flags = {
    app: flags.app(),
    remote: flags.remote()
  }

  async run () {
    let feature = this.args.feature
    let request
    let target

    try {
      await this.heroku.get(`/account/features/${feature}`)
      request = this.disableFeature(feature)
      target = (await this.heroku.get('/account')).body.email
    } catch (err) {
      if (err.http.statusCode !== 404) throw err
      // might be an app feature
      if (!this.app) throw err
      await this.heroku.get(`/apps/${this.app}/features/${feature}`)
      request = this.disableFeature(feature, this.app)
      target = this.app
    }

    this.out.action.start(`Disabling ${this.out.color.green(feature)} for ${this.out.color.cyan(target)}`)
    await request
  }

  disableFeature (feature: string, app?: ?string) {
    return this.heroku.patch(app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`, {
      body: {enabled: false}
    })
  }
}
