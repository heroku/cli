import {Command, flags as Flags} from '@heroku-cli/command'

import {BuildpackCommand} from '../../buildpacks'

export default class Add extends Command {
  static description: 'add new app buildpack, inserting into list of buildpacks if necessary'
  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
    index: Flags.integer({
      name: 'index',
      description: 'the 1-based index of the URL in the list of URLs',
      char: 'i'
    })
  }
  static args = [
    {name: 'buildpack', required: true}
  ]

  async run() {
    let {args, flags} = this.parse(Add)
    let buildpackCommand = new BuildpackCommand(this.heroku)

    if (flags.index !== undefined) {
      buildpackCommand.validateIndex(flags.index)
    }

    let buildpacks = await buildpackCommand.fetch(flags.app)
    await buildpackCommand.validateUrlNotSet(buildpacks, args.buildpack)

    let spliceIndex: number
    if (flags.index === undefined) {
      spliceIndex = buildpacks.length
    } else {
      let foundIndex = buildpackCommand.findIndex(buildpacks, flags.index)
      spliceIndex = (foundIndex === -1) ? buildpacks.length : foundIndex
    }

    let buildpackUpdates = await buildpackCommand.mutate(flags.app, buildpacks, spliceIndex, args.buildpack, 'add')
    buildpackCommand.displayUpdate(flags.app, flags.remote || '', buildpackUpdates, 'added')
  }
}
