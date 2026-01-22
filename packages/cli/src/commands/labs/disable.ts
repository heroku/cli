import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

const SecurityExceptionFeatures: any = {
  'spaces-strict-tls': {
    async prompt(app: string): Promise<string> {
      ux.warn('Insecure Action')
      const name = await hux.prompt(`You are enabling an older security protocol, TLS 1.0, which some organizations may not deem secure.
To proceed, type ${app} or re-run this command with --confirm ${app}`)
      return name
    },
  },
}

export default class LabsDisable extends Command {
  static args = {
    feature: Args.string({description: 'unique identifier or name of the account feature', required: true}),
  }

  static description = 'disables an experimental feature'

  static flags = {
    app: flags.app(),
    confirm: flags.string({required: false}),
    remote: flags.remote(),
  }

  disableFeature(feature: string, app?: string): Promise<any> {
    return this.heroku.patch(app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`, {
      body: {enabled: false},
    })
  }

  async run() {
    const {args, flags} = await this.parse(LabsDisable)
    const {feature} = args
    let request
    let target

    if (SecurityExceptionFeatures[feature]) {
      if (flags.confirm !== flags.app) {
        const {prompt} = SecurityExceptionFeatures[feature]
        const confirm = await prompt(flags.app)
        if (confirm !== flags.app) {
          this.error('Confirmation name did not match app name. Try again.')
        }
      }
    }

    try {
      await this.heroku.get(`/account/features/${feature}`)
      request = this.disableFeature(feature)
      const targetResponse = await this.heroku.get<Heroku.Account>('/account')
      target = color.user(targetResponse.body.email || '')
    } catch (error: any) {
      if (error.http.statusCode !== 404) throw error
      // might be an app feature
      if (!flags.app) throw error
      await this.heroku.get<Heroku.AppFeature>(`/apps/${flags.app}/features/${feature}`)
      request = this.disableFeature(feature, flags.app)
      target = color.app(flags.app)
    }

    ux.action.start(`Disabling ${color.name(feature)} for ${target}`)
    await request
    ux.action.stop()
  }
}
