import {getConfig} from './testInstances'
import {Command} from '@heroku-cli/command'
import {Config} from '@oclif/core'

type CmdConstructor<T extends Command = Command> = new(args: string[], config: Config) => T

const runCommand = (Cmd: CmdConstructor, args: string[]) => {
  const instance = new Cmd(args, getConfig())

  return instance.run()
}

export default runCommand
