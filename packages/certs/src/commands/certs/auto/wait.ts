import {Command, flags} from '@oclif/command'

export default class CertsAutoWait extends Command {
  static description = 'waits for the certificate to be activated'
  static hidden = true

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    this.parse(CertsAutoWait)
  }
}
