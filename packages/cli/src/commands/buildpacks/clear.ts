import {Command, flags as Flags} from '@heroku-cli/command'

import {BuildpackCommand} from '../../lib/buildpacks/buildpacks'

export default class Clear extends Command {
  static description = 'clear all buildpacks set on the app'

  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(Clear)
    const buildpackCommand = new BuildpackCommand(this.heroku)
    await buildpackCommand.clear(flags.app, 'clear', 'cleared')
  }
}
