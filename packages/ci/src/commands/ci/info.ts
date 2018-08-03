import {Command, flags} from '@oclif/command'

export default class Info extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ oclif-example ci:info
showing info from ./src/ci/info.ts!
`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Info)

    const name = flags.name || 'world'
    this.log(`hi ${name} from ./src/commands/ci/info.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
