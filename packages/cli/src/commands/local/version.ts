import {Command} from '@oclif/core'

import {nf} from '../../lib/local/run-foreman'

export default class Version extends Command {
  static description = 'display node-foreman version'

  async run() {
    await this.parse(Version)

    const execArgv = ['--version']
    await nf(execArgv)
  }
}
