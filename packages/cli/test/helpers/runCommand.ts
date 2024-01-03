import {getConfig} from './testInstances.js'
import {Command} from '@heroku-cli/command'
import {Config} from '@oclif/core'

type CmdConstructor = new<T extends Command>(args: string[], config: Config) => T

const runCommand = (Cmd: CmdConstructor, args: string[]) => {
  const instance = new Cmd(args, getConfig())

  return instance.run()
}

export default runCommand
