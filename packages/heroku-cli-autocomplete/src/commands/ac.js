// @flow
import {Command} from 'cli-engine-heroku'

export default class extends Command {
  static topic = 'ac'
  static description = 'ac'
  static hidden = true

  async run () {
    this.out.debug('ac present')
  }
}
