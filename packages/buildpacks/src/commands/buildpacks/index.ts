import {Command, flags as Flags} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import {BuildpackCommand} from '../../buildpacks'

export default class Index extends Command {
  static description = 'display the buildpacks for an app'

  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(Index)
    const buildpacksCommand = new BuildpackCommand(this.heroku)

    const buildpacks = await buildpacksCommand.fetch(flags.app)
    if (buildpacks.length === 0) {
      this.log(`${flags.app} has no Buildpack URL set.`)
    } else {
      CliUx.ux.styledHeader(`${flags.app} Buildpack URL${buildpacks.length > 1 ? 's' : ''}`)
      buildpacksCommand.display(buildpacks, '')
    }
  }
}
