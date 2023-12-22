import {getConfig} from './testInstances.js'
import Info from '../../src/commands/features/info'

// not sure how else to get the type of an implemented @heroku-cli/command Command
const runCommand = (Cmd: typeof Info, args: string[]) => {
  const instance = new Cmd(args, getConfig())

  return instance.run()
}

export default runCommand
