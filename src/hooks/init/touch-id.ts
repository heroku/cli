import {Hook} from '@oclif/core'
import {wrapAPIClientWithTouchId} from '../../lib/biometric/api-client-wrapper'

const hook: Hook<'init'> = async function (opts) {
  // Check if Touch ID is explicitly enabled (via `ht` command or env var)
  const touchIdEnabled = process.env.HEROKU_TOUCH_ID_ENABLED === 'true' || process.env.HEROKU_TOUCH_ID_ENABLED === '1'

  // Check if Touch ID is explicitly disabled
  const touchIdDisabled = process.env.HEROKU_DISABLE_TOUCH_ID === '1' || process.env.HEROKU_DISABLE_TOUCH_ID === 'true'

  if (touchIdDisabled || !touchIdEnabled) {
    return
  }

  // Debug logging
  if (process.env.DEBUG_TOUCH_ID) {
    console.error('[Touch ID Debug] Init hook running, Touch ID enabled')
  }

  // Wrap the Command base class to intercept heroku client getter
  try {
    const {Command} = require('@heroku-cli/command')

    // Store the original getter
    const descriptor = Object.getOwnPropertyDescriptor(Command.prototype, 'heroku')
    if (descriptor && descriptor.get) {
      const originalGetter = descriptor.get

      if (process.env.DEBUG_TOUCH_ID) {
        console.error('[Touch ID Debug] Found heroku getter, wrapping it')
      }

      // Replace with wrapped version
      Object.defineProperty(Command.prototype, 'heroku', {
        get(this: any) {
          const client = originalGetter.call(this)
          // Wrap only once
          if (client && !(client as any).__TOUCH_ID_WRAPPED) {
            if (process.env.DEBUG_TOUCH_ID) {
              console.error('[Touch ID Debug] Wrapping API client')
            }

            wrapAPIClientWithTouchId(client);
            (client as any).__TOUCH_ID_WRAPPED = true
          }

          return client
        },
        configurable: true,
        enumerable: true,
      })
    } else if (process.env.DEBUG_TOUCH_ID) {
      console.error('[Touch ID Debug] Could not find heroku getter descriptor')
    }
  } catch (error) {
    // Silently fail if we can't wrap - better than breaking the CLI
    console.warn('Failed to enable Touch ID:', error)
  }
}

export default hook
