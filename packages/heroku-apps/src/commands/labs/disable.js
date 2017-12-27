// @flow

import {Command, flags} from 'cli-engine-heroku'

const SecurityExceptionFeatures = {
  'spaces-strict-tls': {
    prompt: async function (out: any, app: string): Promise<string> {
      const cliUtil = require('heroku-cli-util')
      out.warn('WARNING: Insecure Action')
      out.warn('You are enabling an older security protocol, TLS 1.0, which some organizations may not deem secure.')
      out.warn(`To proceed, type ${app} or re-run this command with --confirm ${app}`)
      let name = await cliUtil.prompt()
      return name
    }
  }
}

export default class LabsDisable extends Command {
  static topic = 'labs'
  static command = 'disable'
  static description = 'disables an experimental feature'
  static args = [{name: 'feature'}]
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    confirm: flags.string({required: false})
  }

  async run () {
    let feature = this.args.feature
    let request
    let target

    if (SecurityExceptionFeatures[feature]) {
      if (this.flags.confirm !== this.flags.app) {
        let prompt = SecurityExceptionFeatures[feature].prompt
        let confirm = await prompt(this.out, this.flags.app)
        if (confirm !== this.flags.app) {
          throw new Error('Confirmation name did not match app name. Try again.')
        }
      }
    }

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
