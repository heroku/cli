import color from '@heroku-cli/color'
import {ux} from '@oclif/core'

export default function confirmApp(app: string, confirm?: string, message?: string): Promise<void | Error> {
  return new Promise(function (resolve, reject) {
    if (confirm) {
      if (confirm === app) return resolve()
      return reject(new Error(`Confirmation ${color.bold.red(confirm)} did not match ${color.bold.red(app)}. Aborted.`))
    }

    if (!message) {
      message = `WARNING: Destructive Action
This command will affect the app ${color.bold.red(app)}`
    }

    ux.warn(message)
    console.error()
    ux.prompt(`To proceed, type ${color.bold.red(app)} or re-run this command with ${color.bold.red('--confirm', app)}`)
      .then(function (entered) {
        if (entered === app) {
          return resolve()
        }

        return reject(new Error(`Confirmation did not match ${color.bold.red(app)}. Aborted.`))
      })
  })
}
