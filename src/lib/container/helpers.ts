import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {containerExtensions, NotAContainerAppError} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

type Platform = HerokuSDK<[typeof containerExtensions]>['platform']

const stackLabelMap: {[key: string]: string} = {
  cnb: 'Cloud Native Buildpack',
}

/**
 * Ensure that the given app is a container app.
 * @param app {String} heroku app name
 * @param cmd {String} command name
 * @returns {null} null
 */
export async function ensureContainerStack(platform: Platform, app: string, cmd: string): Promise<void> {
  try {
    await platform.container.ensureContainerStack(app)
  } catch (error) {
    if (error instanceof NotAContainerAppError) {
      const {app} = error
      let message = 'This command is for Docker apps only.'
      if (['push', 'release'].includes(cmd)) {
        message += ` Switch stacks by running ${color.code('heroku stack:set container')}. Or, to deploy ${color.app(app.name)} with ${color.name(app.stack.name)}, run ${color.code('git push heroku main')} instead.`
      }

      ux.error(message, {exit: 1})
    }

    throw error
  }
}
