const cli = require('heroku-cli-util')

/**
 * Ensure that the given app is a container app.
 * @param app {Object} heroku app
 * @returns {null} null
 */
function ensureContainerStack(app) {
  if (app.stack.name !== 'container') {
    cli.exit(1, `This command is only supported for the ${cli.color.cyan('container')} stack. The stack for app ${cli.color.cyan(app.name)} is ${cli.color.cyan(app.stack.name)}.`)
  }
}

module.exports = {
  ensureContainerStack,
}
