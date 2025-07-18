/*
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {color} from '@heroku-cli/color'
import {ensureContainerStack} from '../../lib/container/helpers.js'
import * as Heroku from '@heroku-cli/schema'

export default class Rm extends Command {
  static topic = 'container'
  static description = 'remove the process type from your app'
  static usage = 'container:rm -a APP [-v] PROCESS_TYPE...'
  static example = `
  ${color.cmd('heroku container:rm web')}        # Destroys the web container
  ${color.cmd('heroku container:rm web worker')} # Destroys the web and worker containers`

  static strict = false

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {argv, flags} = await this.parse(Rm)
    const {app} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n${Rm.example}`)
    }

    const {body: appBody} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
    ensureContainerStack(appBody, 'rm')

    for (const process of argv as string[]) {
      ux.action.start(`Removing container ${process} for ${color.app(app)}`)
      await this.heroku.patch(`/apps/${app}/formation/${process}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.docker-releases',
        },
        body: {docker_image: null},
      })
      ux.action.stop()
    }
  }
}
*/
