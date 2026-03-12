import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {ensureContainerStack} from '../../lib/container/helpers.js'

export default class Rm extends Command {
  static description = 'remove the process type from your app'
  static examples = [
    `${color.command('heroku container:rm web')}        # Destroys the web container`,
    `${color.command('heroku container:rm web worker')} # Destroys the web and worker containers`,
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static strict = false

  static topic = 'container'

  static usage = 'container:rm -a APP [-v] PROCESS_TYPE...'

  async run() {
    const {argv, flags} = await this.parse(Rm)
    const {app} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n${Rm.examples.join('\n')}`)
    }

    const {body: appBody} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
    ensureContainerStack(appBody, 'rm')

    for (const process of argv as string[]) {
      ux.action.start(`Removing container ${process} for ${color.app(app)}`)
      await this.heroku.patch(`/apps/${app}/formation/${process}`, {
        body: {docker_image: null},
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.docker-releases',
        },
      })
      ux.action.stop()
    }
  }
}
