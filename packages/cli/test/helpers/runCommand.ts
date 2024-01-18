import {getConfig} from './testInstances'
import {Command} from '@heroku-cli/command'
import {stdout, stderr} from 'stdout-stderr'

type CmdConstructorParams = ConstructorParameters<typeof Command>
type GenericCmd = new (...args: CmdConstructorParams) => Command

const runCommand = (Cmd: GenericCmd, args: string[] = []) => {
  const instance = new Cmd(args, getConfig())
  stdout.start()
  stderr.start()
  return instance.run().then(args => {
    stdout.stop()
    stderr.stop()
    return args
  })
    .catch((error: any) => {
      stdout.stop()
      stderr.stop()
      throw error
    })
}

export default runCommand
