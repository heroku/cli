import color from '@heroku-cli/color'
import {APIClient, Command} from '@heroku-cli/command'

import {IConfig} from '@oclif/config'

type ContextArgument = {pipeline: string | undefined; app: string | undefined}
type WebhookType = {path: string, display: string}

export default abstract class extends Command {
  webhooksClient: APIClient

  protected constructor(argv: string[], config: IConfig) {
    super(argv, config)

    const client = new APIClient(this.config, {})
    client.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'application/vnd.heroku+json; version=3.webhooks',
      authorization: `Basic ${Buffer.from(':' + this.heroku.auth).toString('base64')}`
    }
    this.webhooksClient = client
  }

  webhookType(context: ContextArgument): WebhookType {
    if (context.pipeline) {
      return {
        path: `/pipelines/${context.pipeline}`,
        display: context.pipeline
      }
    }
    if (context.app) {
      return {
        path: `/apps/${context.app}`,
        display: color.app(context.app)
      }
    }
    throw new Error('No app specified')
  }
}
