import {Hook} from '@oclif/core/hooks'

import Git from '../../lib/git/git.js'

const hook: Hook.Init = async function () {
  // Skip for --version / completion-style invocations to avoid a needless git subprocess.
  const arg = process.argv[2]
  if (!arg || arg === '--version' || arg === 'autocomplete') return

  const git = new Git()
  try {
    await git.configureCredentialHelper()
  } catch {
    // ignore — best-effort; never block a command on git config
  }
}

export default hook
