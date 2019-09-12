import {Command} from '@heroku-cli/command'
import {IConfig} from '@oclif/config'

export default abstract class extends Command {
  protected constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.heroku.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'application/vnd.heroku+json; version=3.enterprise-accounts',
    }
  }
}
