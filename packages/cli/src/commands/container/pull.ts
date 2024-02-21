import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as DockerHelper from '../../lib/container/docker_helper'
import {debug} from '../../lib/container/debug'
import color from '@heroku-cli/color'

export default class Pull extends Command {
  static topic = 'container'
  static description = 'pulls an image from an app\'s process type'
  static usage = `
  ${color.cmd('heroku container:pull web')}        # Pulls the web image from the app
  ${color.cmd('heroku container:pull web worker')} # Pulls both the web and worker images from the app
  ${color.cmd('heroku container:pull web:latest')} # Pulls the latest tag from the web image`

  static strict = false

  static flags = {
    app: flags.app({required: true}),
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {argv, flags} = await this.parse(Pull)
    const {verbose, app} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n ${Pull.usage}`)
    }

    const herokuHost = process.env.HEROKU_HOST || 'heroku.com'
    const registry = `registry.${herokuHost}`

    if (verbose) {
      debug.enabled = true
    }

    for (const process of argv as string[]) {
      const tag = `${registry}/${app}/${process}`
      ux.styledHeader(`Pulling ${process} as ${tag}`)
      await DockerHelper.pullImage(tag)
    }
  }
}
