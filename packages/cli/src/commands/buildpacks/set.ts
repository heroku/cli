import {Command, flags as Flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'

import {BuildpackCommand} from '../../lib/buildpacks/buildpacks'

export default class Set extends Command {
  static description: 'set new app buildpack, overwriting into list of buildpacks if necessary'

  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
    index: Flags.integer({
      description: 'the 1-based index of the URL in the list of URLs',
      char: 'i',
    }),
  }

  static args = {
    buildpack: Args.string({
      required: true,
      description: 'namespace/name of the buildpack',
    }),
  }

  async run() {
    const {args, flags} = await this.parse(Set)

    if (flags.index && flags.index < 0) {
      this.error('Invalid index. Must be greater than 0.')
    }

    const buildpackCommand = new BuildpackCommand(this.heroku)
    const buildpacks = await buildpackCommand.fetch(flags.app)

    await buildpackCommand.validateUrlNotSet(buildpacks, args.buildpack)

    let spliceIndex: number
    if (flags.index === undefined) {
      spliceIndex = 0
    } else {
      // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
      const foundIndex = buildpackCommand.findIndex(buildpacks, flags.index)
      spliceIndex = (foundIndex === -1) ? buildpacks.length : foundIndex
    }

    const buildpackUpdates = await buildpackCommand.mutate(flags.app, buildpacks, spliceIndex, args.buildpack, 'set')
    buildpackCommand.displayUpdate(flags.app, flags.remote || '', buildpackUpdates, 'set')
  }
}
