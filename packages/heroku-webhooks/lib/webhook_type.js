let cli = require('heroku-cli-util')

module.exports = function (context) {
  if (context.flags.pipeline) {
    return {
      path: `/pipelines/${context.flags.pipeline}`,
      display: context.flags.pipeline
    }
  } else if (context.app) {
    return {
      path: `/apps/${context.app}`,
      display: cli.color.app(context.app)
    }
  } else {
    throw new Error('No app specified')
  }
}
