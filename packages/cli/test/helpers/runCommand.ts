import {getConfig} from './testInstances'
import {Command} from '@heroku-cli/command'
import {stdout, stderr} from 'stdout-stderr'

type CmdConstructorParams = ConstructorParameters<typeof Command>
type GenericCmd = new (...args: CmdConstructorParams) => Command

const stopMock = () => {
  stdout.stop()
  stderr.stop()
}

const runCommand = (Cmd: GenericCmd, args: string[] = [], printStd = false) => {
  const instance = new Cmd(args, getConfig())
  if (printStd) {
    stdout.print = true
    stderr.print = true
  }

  stdout.start()
  stderr.start()

  return instance
    .run()
    .then(args => {
      stopMock()
      return args
    })
    .catch((error: Error) => {
      stopMock()
      throw error
    })
}

export default runCommand
