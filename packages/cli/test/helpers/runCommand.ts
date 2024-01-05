import {getConfig} from './testInstances'
import {Command} from '@heroku-cli/command'

type CmdConstructorParams = ConstructorParameters<typeof Command>
type GenericCmd = new (...args: CmdConstructorParams) => Command

const runCommand = (Cmd: GenericCmd, args: string[]) => {
  const instance = new Cmd(args, getConfig())

  return instance.run()
}

export default runCommand
