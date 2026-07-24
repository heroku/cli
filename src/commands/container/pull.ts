import {Command, flags, vars} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'

import {debug} from '../../lib/container/debug.js'
import {DockerHelper} from '../../lib/container/docker-helper.js'
import {ensureContainerStack} from '../../lib/container/helpers.js'

export default class Pull extends Command {
  static description = 'pulls an image from an app\'s process type'
  static examples = [
    `${color.command('heroku container:pull web')}        # Pulls the web image from the app`,
    `${color.command('heroku container:pull web worker')} # Pulls both the web and worker images from the app`,
    `${color.command('heroku container:pull web:latest')} # Pulls the latest tag from the web image`,
  ]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    verbose: flags.boolean({char: 'v'}),
  }
  static strict = false
  static topic = 'container'
  static usage = 'container:pull -a APP [-v] PROCESS_TYPE...'
  dockerHelper = new DockerHelper()

  async run() {
    const {platform} = new HerokuSDK()
    const {argv, flags} = await this.parse(Pull)
    const {app, verbose} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n${Pull.examples.join('\n')}`)
    }

    const appBody = await platform.app.info(app)
    ensureContainerStack(appBody, 'pull')

    const registry = `registry.${vars.host}`

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
