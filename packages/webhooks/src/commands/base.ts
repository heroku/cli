import {APIClient, Command} from '@heroku-cli/command'

import {IConfig} from '@oclif/config'

export default abstract class extends Command {
  httpClient: APIClient

  protected constructor(argv: string[], config: IConfig) {
    super(argv, config)

    const client = new APIClient(this.config, {})
    client.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'application/vnd.heroku+json; version=3.webhooks',
      authorization: `Basic ${Buffer.from(':' + this.heroku.auth).toString('base64')}`
    }
    this.httpClient = client
  }
}
