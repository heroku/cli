import {Command, flags as Flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import {BuildpackCommand} from '../../buildpacks'

export default class Remove extends Command {
  static description = 'remove a buildpack set on the app'

  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
    index: Flags.integer({
      description: 'the 1-based index of the URL to remove from the list of URLs',
      char: 'i',
    }),
  }

  static args = [
    {
      name: 'buildpack',
      description: 'namespace/name of the buildpack',
    },
  ]

  async run() {
    const {args, flags} = this.parse(Remove)
    const buildpackCommand = new BuildpackCommand(this.heroku)

    if (flags.index && args.buildpack) {
      cli.error('Please choose either index or Buildpack, but not both.', {exit: 1})
    }
    if (!flags.index && !args.buildpack) {
      cli.error('Usage: heroku buildpacks:remove [BUILDPACK_URL]. Must specify a buildpack to remove, either by index or URL.')
    }

    const buildpacks = await buildpackCommand.fetch(flags.app)
    if (buildpacks.length === 0) {
      cli.error(`No buildpacks were found. Next release on ${flags.app} will detect buildpack normally.`, {exit: 1})
    }

    let spliceIndex: number
    if (flags.index) {
      buildpackCommand.validateIndexInRange(buildpacks, flags.index)
      spliceIndex = await buildpackCommand.findIndex(buildpacks, flags.index)
    } else {
      spliceIndex = await buildpackCommand.findUrl(buildpacks, args.buildpack)
    }

    if (spliceIndex === -1) {
      cli.error('Buildpack not found. Nothing was removed.', {exit: 1})
    }

    if (buildpacks.length === 1) {
      await buildpackCommand.clear(flags.app, 'remove', 'removed')
    } else {
      const buildpackUpdates = await buildpackCommand.mutate(flags.app, buildpacks, spliceIndex, args.buildpack, 'remove')
      buildpackCommand.displayUpdate(flags.app, flags.remote || '', buildpackUpdates, 'removed')
    }
  }
}
