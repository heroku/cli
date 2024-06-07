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
  if (app.stack?.name !== 'container') {
    const appLabel = app.stack?.name ? stackLabelMap[app.stack.name] : app.stack?.name
    let message = 'This command is for Docker apps only.'
    if (['push', 'release'].includes(cmd)) {
      message += ` Run ${color.cyan('git push heroku main')} to deploy your ${color.cyan(app.name)} ${color.cyan(appLabel)}`
    }

    ux.error(message, {exit: 1})
  }
}
