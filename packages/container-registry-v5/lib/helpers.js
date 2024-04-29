const cli = require('heroku-cli-util')

const stackLabelMap = {
  cnb: 'Cloud Native Buildpack',
}

/**
 * Ensure that the given app is a container app.
 * @param app {Object} heroku app
 * @param cmd {String} command name
 * @returns {null} null
 */
function ensureContainerStack(app, cmd) {
  if (app.stack.name !== 'container') {
    const appLabel = stackLabelMap[app.stack.name] || app.stack.name
    let message = 'This command is for Docker apps only.'
    if (cmd === 'push' || cmd === 'release') {
      message += ` Run ${cli.color.cyan('git push heroku main')} to deploy your ${cli.color.cyan(app.name)} ${cli.color.cyan(appLabel)} app instead.`
    }

    cli.exit(1, message)
  }
}

module.exports = {
  ensureContainerStack,
}
