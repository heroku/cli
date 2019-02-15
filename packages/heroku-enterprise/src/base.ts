import {Command} from '@heroku-cli/command'
import {IConfig, LoadOptions} from '@oclif/config'
import {cli} from 'cli-ux'

export default abstract class extends Command {
  static async run(argv?: string[], config?: LoadOptions) {
    // TODO: remove after GA
    cli.warn(`heroku-enterprise is part of the Heroku Enterprise Account Beta program.
For more info, please see "http://github.com/heroku/heroku-enterprise" or contact your CSA.
`)

    return super.run(argv, config)
  }

  protected constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.heroku.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'application/vnd.heroku+json; version=3.enterprise-accounts',
    }
  }
}
