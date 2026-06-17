import {Hook} from '@oclif/core'

// This hook is kept for future use but currently does nothing
// The Touch ID wrapping is handled in the init hook
const hook: Hook<'prerun'> = async function (opts) {
  // No-op - Touch ID wrapping happens in init hook
}

export default hook
