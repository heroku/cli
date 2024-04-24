import {getConfig} from './testInstances'
import {Command} from '@heroku-cli/command-v9'
import {stdout, stderr} from 'stdout-stderr'

type CmdConstructorParams = ConstructorParameters<typeof Command>
export type GenericCmd = new (...args: CmdConstructorParams) => Command

const stopMock = () => {
  stdout.stop()
  stderr.stop()
}

const runCommand = async (Cmd: GenericCmd, args: string[] = [], printStd = false) => {
  const conf = await getConfig()
  const instance = new Cmd(args, conf)
  if (printStd) {
    stdout.print = true
    stderr.print = true
  }

  stdout.start()
  stderr.start()

  try {
    instance
      .run()
      .then(args => {
        stopMock()
        return args
      })
  } catch (error: any) {
    stopMock()
    throw error
  }
}

export default runCommand
