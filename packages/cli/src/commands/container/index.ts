import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'
const {version} = require('../../../package.json')

export default class ContainerIndex extends Command {
  static description = 'Use containers to build and deploy Heroku apps'
  static topic = 'container'

  async run() {
    ux.log(version)
  }
}
