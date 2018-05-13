import {Main as Base} from '@oclif/command'
import * as Config from '@oclif/config'
import ux from 'cli-ux'

import Command from './subject'
import SubjectCommand from './subject_command'

export class Main extends Base {
  async run(): Promise<any> {
    const [rawPath, cmd, ...argv] = this.argv
    if (!rawPath || rawPath[0] !== '@') return super.run()
    const path = rawPath.slice(1).split(':')
    const root = path[0]
    const Subject = Object.values(require(`./subjects/${root}`))[0] as {new(config: Config.IConfig, path: string[], argv: string[]): Command}
    const subject = new Subject(this.config, path, argv)
    const commands = await subject.commands()
    if (cmd) await this.runCommand(commands, cmd, argv)
    else await this.listCommands(commands)
  }

  async runCommand(commands: {[k: string]: string}, cmd: string, argv: string[]) {
    const Command = Object.values(require(`./commands/${commands[cmd]}`))[0] as typeof SubjectCommand
    await Command.run(argv, this.config)
  }

  listCommands(commands: {[k: string]: string}) {
    for (let c of Object.entries(commands)) {
      this.log(c[0])
    }
  }
}

export function run(argv = process.argv.slice(2), options?: Config.LoadOptions) {
  return Main.run(argv, options)
}
