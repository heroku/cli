import {Command, flags} from '@oclif/command'

export default class Apps extends Command {
  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'file'}]

  async run() {
    this.log('foo')
  }
}
