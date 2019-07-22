import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export default class ReviewappsEnable extends Command {
  static description = 'enable review apps and/or settings on an existing pipeline'

  static examples = [
    `$ heroku reviewapps:enable -p mypipeline --a myapp --autodeploy --autodestroy
`,
  ]

  static flags = {
    app: flags.string({ char: 'a', description: 'parent app used by review apps' }),
    pipeline: flags.string({ char: 'p', description: 'name of pipeline' }),
    autodeploy: flags.boolean({ description: 'autodeploy the review app', required: false }),
    autodestroy: flags.boolean({ description: 'autodestroy the review app', required: false }),
  }

  async run() {
    const {args, flags} = this.parse(ReviewappsEnable)

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
    this.cli.action.start('Configuring pipeline')

    let { body: app } = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)

    await this.heroku.patch(`/apps/${app.id}/github`, {
      hostname: 'kolkrabbi.heroku.com',
      body: settings
    })

    this.cli.action.stop()
  }
}
