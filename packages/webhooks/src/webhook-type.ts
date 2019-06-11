import color from '@heroku-cli/color'

type ContextArgument = {pipeline: string | undefined; app: string | undefined}
type WebhookType = {path: string, display: string}

export default function (context: ContextArgument): WebhookType {
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
