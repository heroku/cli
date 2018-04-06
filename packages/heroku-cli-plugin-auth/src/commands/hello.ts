import {Command, flags} from '@oclif/command'

export default class Hello extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ oclif-example hello
hello world from ./src/hello.ts!
`,
  ]

  static flags = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Hello)

    const name = flags.name || 'world'
    this.log(`hello ${name} from ./src/commands/heroku-cli-auth.ts!`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
