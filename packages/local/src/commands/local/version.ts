import {Command} from '@oclif/command'

import {fork as foreman} from '../../fork-foreman'

export default class Local extends Command {
  static description = 'display node-foreman version'

  async run() {
    let execArgv = ['--version']
    await foreman(execArgv)
  }
}
