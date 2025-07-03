import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {DockerHelper} from '../../lib/container/docker_helper.js'
import {ensureContainerStack} from '../../lib/container/helpers.js'
import {debug} from '../../lib/container/debug.js'
import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'

export default class Pull extends Command {
  static topic = 'container'
  static description = 'pulls an image from an app\'s process type'
  static usage = 'container:pull -a APP [-v] PROCESS_TYPE...'
  static example = `
  ${color.cmd('$ heroku container:pull web')}        # Pulls the web image from the app
  ${color.cmd('$ heroku container:pull web worker')} # Pulls both the web and worker images from the app
  ${color.cmd('$ heroku container:pull web:latest')} # Pulls the latest tag from the web image`

  static strict = false

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    verbose: flags.boolean({char: 'v'}),
  }

  dockerHelper = new DockerHelper()

  async run() {
    const {argv, flags} = await this.parse(Pull)
    const {verbose, app} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n${Pull.example}`)
    }

    const {body: appBody} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
    ensureContainerStack(appBody, 'pull')

    const herokuHost = process.env.HEROKU_HOST || 'heroku.com'
    const registry = `registry.${herokuHost}`

    if (verbose) {
      debug.enabled = true
    }

    for (const process of argv as string[]) {
      const tag = `${registry}/${app}/${process}`
      hux.styledHeader(`Pulling ${process} as ${tag}`)
      await this.dockerHelper.pullImage(tag)
    }
  }
}
