import {Command, flags as HerokuFlags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class ReviewappsDisable extends Command {
  static description = 'disable review apps or settings on an existing pipeline'

  static examples = [
    '$ heroku reviewapps:disable -p mypipeline -a myapp --autodeploy'
  ]

  static flags = {
    app: HerokuFlags.app({description: 'parent app used by review apps', required: true}),
    pipeline: HerokuFlags.pipeline({required: true}),
    remote: HerokuFlags.remote(),
    autodeploy: HerokuFlags.boolean({description: 'disable autodeployments'}),
    autodestroy: HerokuFlags.boolean({description: 'disable automatically destroying review apps'})
  }

  async run() {
    const {flags} = this.parse(ReviewappsDisable)

    // if no flags are passed then the user is disabling review apps
    let disable = !flags.autodeploy && !flags.autodestroy

    let settings = {
      pull_requests: {
        enabled: !disable,
        auto_deploy: false,
        auto_destroy: false
      }
    }

    if (flags.autodeploy) {
      this.log('Disabling auto deployment...')
      settings.pull_requests.auto_deploy = false
    }
    if (flags.autodestroy) {
      this.log('Disabling auto destroy...')
      settings.pull_requests.auto_destroy = false
    }

    cli.action.start('Configuring pipeline')

    let {body: app} = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)

    await this.heroku.patch(`/apps/${app.id}/github`, {
      hostname: 'kolkrabbi.heroku.com',
      body: settings
    })

    cli.action.stop()
  }
}
