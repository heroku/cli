import {Command, Flags} from '@oclif/core'

export default class CertsAutoWait extends Command {
  static description = 'waits for the certificate to be activated'

  static hidden = true

  static flags = {
    help: Flags.help({char: 'h'}),
  }

  async run() {
    this.parse(CertsAutoWait)
  }
}
