import {getConfig} from './testInstances.js'
// import {Command} from '@heroku-cli/command'

// not sure how else to get the type of an implemented @heroku-cli/command Command
const runCommand = (Cmd: any, args: string[]) => {
  const instance = new Cmd(args, getConfig())

  return instance.run()
}

export default runCommand
