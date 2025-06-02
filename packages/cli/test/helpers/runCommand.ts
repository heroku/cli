import {getConfig} from './testInstances.js'
import {Command} from '@heroku-cli/command'
import {stdout, stderr} from 'stdout-stderr'

type CmdConstructorParams = ConstructorParameters<typeof Command>
export type GenericCmd = new (...args: CmdConstructorParams) => Command

const stopMock = () => {
  stdout.stop()
  stderr.stop()
}

const runCommand = async (Cmd: GenericCmd, args: string[] = [], printStd = false) => {
  stderr.start()
  stdout.start()
  const conf = await getConfig()
  const instance = new Cmd(args, conf)
  if (printStd) {
    stdout.print = true
    stderr.print = true
  }

  try {
    const result = await instance.run()
    // Wait a tick to ensure all stderr output is captured
    await new Promise(resolve => setTimeout(resolve, 0))
    stopMock()
    return result
  } catch (error) {
    // Wait a tick to ensure all stderr output is captured
    await new Promise(resolve => setTimeout(resolve, 0))
    stopMock()
    throw error
  }
}

export default runCommand
