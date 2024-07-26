import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

const stackLabelMap: { [key: string]: string} = {
  cnb: 'Cloud Native Buildpack',
}

/**
 * Ensure that the given app is a container app.
 * @param app {Heroku.App} heroku app
 * @param cmd {String} command name
 * @returns {null} null
 */
export function ensureContainerStack(app: Heroku.App, cmd: string): void {
  const buildStack = app.build_stack?.name
  const appStack = app.stack?.name
  const allowedStack = 'container'

  // either can be container stack and are allowed
  if (buildStack !== allowedStack && appStack !== allowedStack) {
    let message = 'This command is for Docker apps only.'
    if (['push', 'release'].includes(cmd)) {
      message += ` Run ${color.cyan('git push heroku main')} to deploy your ${color.cyan(app.name)} ${color.cyan(appStack)} app instead.`
    }

    ux.error(message, {exit: 1})
  }
}
