let cli = require('heroku-cli-util')

module.exports = function (context) {
  if (context.pipeline) {
    return {
      path: `/pipelines/${context.pipeline}`,
      display: context.pipeline
    }
  }
  if (context.app) {
    return {
      path: `/apps/${context.app}`,
      display: cli.color.app(context.app)
    }
  }
  throw new Error('No app specified')
}
