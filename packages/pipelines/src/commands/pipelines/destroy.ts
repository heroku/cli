import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'
import {prompt} from 'inquirer'

import disambiguate from '../../disambiguate'

export default class PipelinesAdd extends Command {
  static description = `add this app to a pipeline
The app and pipeline names must be specified.
The stage of the app will be guessed based on its name if not specified.`

  static examples = [
    '$ heroku pipelines:add example -a example-admin -s production'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    stage: flags.string({
      char: 's',
      description: 'stage of first app in pipeline',
    })
  }

  static args = [{
    name: 'pipeline',
    description: 'name of pipeline',
  }]

  async run() {
    const {args, flags} = this.parse(PipelinesAdd)
    const app = flags.app
    
  }
}
