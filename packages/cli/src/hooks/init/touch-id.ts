import {Hook} from '@oclif/core'

const hook: Hook<'init'> = async function (opts) {
  // Check if Touch ID is explicitly enabled (via `ht` command or env var)
  const touchIdEnabled = process.env.HEROKU_TOUCH_ID_ENABLED === 'true' || process.env.HEROKU_TOUCH_ID_ENABLED === '1'

  // Check if Touch ID is explicitly disabled
  const touchIdDisabled = process.env.HEROKU_DISABLE_TOUCH_ID === '1' || process.env.HEROKU_DISABLE_TOUCH_ID === 'true'

  if (touchIdDisabled || !touchIdEnabled) {
    return
  }

  // Store the flag for prerun hook to use
  // The prerun hook runs after command initialization when heroku client is available
  (global as any).__TOUCH_ID_ENABLED = true
}

export default hook
