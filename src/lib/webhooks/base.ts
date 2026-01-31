import {color} from '@heroku/heroku-cli-util'
import {APIClient, Command} from '@heroku-cli/command'
import {Config} from '@oclif/core'

export default abstract class extends Command {
  webhooksClient: APIClient

  protected constructor(argv: string[], config: Config) {
    super(argv, config)

    const client = new APIClient(this.config, {})
    client.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'application/vnd.heroku+json; version=3.webhooks',
      authorization: `Basic ${Buffer.from(':' + this.heroku.auth).toString('base64')}`,
    } as any
    this.webhooksClient = client
  }

  webhookType(context: {app?: string; pipeline?: string}): {display: string; path: string} {
    if (context.pipeline) {
      return {
        display: context.pipeline,
        path: `/pipelines/${context.pipeline}`,
      }
    }

    if (context.app) {
      return {
        display: color.app(context.app),
        path: `/apps/${context.app}`,
      }
    }

    return this.error('No app specified')
  }
}
