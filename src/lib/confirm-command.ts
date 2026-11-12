import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

export type ConfirmOptions = {
  /** Pass `this.jsonEnabled()`. Under --json a missing --confirm is an error instead of a prompt. */
  json?: boolean
}

export default class ConfirmCommand {
  async confirm(app: string, confirm?: string, message?: string, {json = false}: ConfirmOptions = {}) {
    if (confirm) {
      if (confirm === app) return
      throw new Error(`Confirmation ${color.warning(confirm)} did not match ${color.info(app)}. Aborted.`)
    }

    if (json) {
      throw new Error(`To proceed, re-run this command with --confirm ${app}. Commands don't prompt for confirmation with --json.`)
    }

    if (!message) {
      message = `Destructive Action
This command will affect the app ${color.app(app)}`
    }

    ux.warn(message)
    console.error()
    const entered = await hux.prompt(
      `To proceed, type ${color.warning(app)} or re-run this command with ${color.code('--confirm ' + app)}`,
      {required: true},
    )
    if (entered === app) {
      return
    }

    throw new Error(`Confirmation did not match ${color.info(app)}. Aborted.`)
  }
}
