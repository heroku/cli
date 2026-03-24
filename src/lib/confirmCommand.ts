import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {HuxHelpers} from './hux-helpers.js'

export default class ConfirmCommand {
  async confirm(app: string, confirm?: string, message?: string) {
    if (confirm) {
      if (confirm === app) return
      throw new Error(`Confirmation ${color.warning(confirm)} did not match ${color.info(app)}. Aborted.`)
    }

    if (!message) {
      message = `Destructive Action
This command will affect the app ${color.app(app)}`
    }

    ux.warn(message)
    console.error()
    const entered = await HuxHelpers.prompt(
      `To proceed, type ${color.warning(app)} or re-run this command with ${color.code('--confirm ' + app)}`,
      {required: true},
    )
    if (entered === app) {
      return
    }

    throw new Error(`Confirmation did not match ${color.info(app)}. Aborted.`)
  }
}
