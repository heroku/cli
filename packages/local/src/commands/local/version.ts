import {Command, flags} from '@oclif/command'
import fork from '../../fork_foreman';

export default class Local extends Command {
  static description = 'display node-foreman version'

  async run() {
    let execArgv = ['--version']
    await fork(execArgv)
  }
}
