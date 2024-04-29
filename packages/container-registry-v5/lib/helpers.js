const cli = require('heroku-cli-util')

const stackLabelMap = {
  cnb: 'Cloud Native Buildpack',
}

/**
 * Ensure that the given app is a container app.
 * @param app {Object} heroku app
 * @returns {null} null
 */
function ensureContainerStack(app) {
  if (app.stack.name !== 'container') {
    const appLabel = stackLabelMap[app.stack.name] || app.stack.name
    cli.exit(1, `This command is for Docker apps only. Run ${cli.color.cyan('git push heroku main')} to deploy your ${cli.color.cyan(app.name)} ${cli.color.cyan(appLabel)} app instead.`)
  }
}

module.exports = {
  ensureContainerStack,
}
