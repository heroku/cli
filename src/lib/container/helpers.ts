import {color} from '@heroku/heroku-cli-util'
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
      message += ` Switch stacks by running ${color.code('heroku stack:set container')}. Or, to deploy ${color.app(app.name ?? '')} with ${color.name(appStack ?? '')}, run ${color.code('git push heroku main')} instead.`
    }

    ux.error(message, {exit: 1})
  }
}
