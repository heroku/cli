import {Hook} from '@oclif/core'
import {wrapAPIClientWithTouchId} from '../../lib/biometric/api-client-wrapper'
import {Command} from '@heroku-cli/command'

const hook: Hook<'prerun'> = async function (opts) {
  // Check if Touch ID was enabled in init hook
  if (!(global as any).__TOUCH_ID_ENABLED) {
    return
  }

  // Access the command instance and wrap its heroku client
  const command = opts.Command as any
  if (command && command.heroku) {
    wrapAPIClientWithTouchId(command.heroku)
  }
}

export default hook
