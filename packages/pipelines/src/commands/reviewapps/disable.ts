import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default class ReviewappsDisable extends Command {
  static description = 'disable review apps or settings on an existing pipeline'

  static examples = [
    `$ heroku reviewapps:disable -p mypipeline -a myapp --autodeploy
    Disabling auto deployment ...
    Configuring pipeline... done`
  ]

  static flags = {
    app: flags.string({char: 'a', description: 'parent app used by review apps', required: true}),
    pipeline: flags.string({char: 'p', description: 'name of pipeline', required: true}),
    remote: flags.string({char: 'r', description: 'git remote of parent app used by review apps', required: false}),
    autodeploy: flags.boolean({description: 'disable autodeployments'}),
    autodestroy: flags.boolean({description: 'disable automatically destroying review apps'})
  }

  async run() {
    const {flags} = this.parse(ReviewappsDisable)

    let disable = false

    // if no flags are passed then the user is disabling review apps
    if (!flags.autodeploy && !flags.autodestroy) {
      disable = true
    }

    const settings = {
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
  }
}
