import {Command} from '@oclif/core'

import {fork as foreman} from '../../fork-foreman'

export default class Version extends Command {
  static description = 'display node-foreman version'

  async run() {
    await this.parse(Version)

    const execArgv = ['--version']
    await foreman(execArgv)
  }
}
