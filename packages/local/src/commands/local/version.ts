import {Command} from '@oclif/command'

import {fork as foreman} from '../../fork-foreman'

export default class Version extends Command {
  static description = 'display node-foreman version'

  async run() {
    this.parse(Version)

    let execArgv = ['--version']
    await foreman(execArgv)
  }
}
