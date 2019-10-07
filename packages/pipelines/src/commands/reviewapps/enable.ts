import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class ReviewappsEnable extends Command {
  static description = 'enable review apps and/or settings on an existing pipeline'

  static examples = [
    '$ heroku reviewapps:enable -p my-pipeline -a my-app --autodeploy --autodestroy',
  ]

  static flags = {
    app: flags.app({
      description: 'parent app used by review apps',
      required: true,
    }),
    remote: flags.remote(),
    pipeline: flags.string({
      char: 'p',
      description: 'name of pipeline',
      required: true,
    }),
    autodeploy: flags.boolean({
      description: 'autodeploy the review app',
    }),
    autodestroy: flags.boolean({
      description: 'autodestroy the review app',
    }),
  }

  async run() {
    const {flags} = this.parse(ReviewappsEnable)

    const settings = {
      pull_requests: {
        enabled: true,
        auto_deploy: false,
        auto_destroy: false
      }
    }

    if (flags.autodeploy) {
      this.log('Enabling auto deployment...')
      settings.pull_requests.auto_deploy = true
    }

    if (flags.autodestroy) {
      this.log('Enabling auto destroy...')
      settings.pull_requests.auto_destroy = true
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
