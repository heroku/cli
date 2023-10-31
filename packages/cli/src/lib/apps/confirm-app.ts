import color from '@heroku-cli/color'
import {ux} from '@oclif/core'

export default async function confirmApp(app: string, confirm?: string, message?: string) {
  if (confirm) {
    if (confirm === app) return
    throw new Error(`Confirmation ${color.bold.red(confirm)} did not match ${color.bold.red(app)}. Aborted.`)
  }

  if (!message) {
    message = `WARNING: Destructive Action
This command will affect the app ${color.bold.red(app)}`
  }

  ux.warn(message)
  console.error()
  const entered = await ux.prompt(
    `To proceed, type ${color.bold.red(app)} or re-run this command with ${color.bold.red('--confirm', app)}`,
    {required: true},
  )
  if (entered === app) {
    return
  }

  throw new Error(`Confirmation did not match ${color.bold.red(app)}. Aborted.`)
}
