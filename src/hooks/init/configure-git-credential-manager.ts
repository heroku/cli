import {Hook} from '@oclif/core/hooks'

import Git from '../../lib/git/git.js'

const hook: Hook.Init = async function () {
  // Skip for --version / completion-style invocations to avoid a needless git subprocess.
  // Version-style invocations include `--version` plus any `oclif.additionalVersionFlags`
  // (e.g. `-v`, `version`) declared in package.json — mirror version.ts, which reads the
  // same config. We hard-include `-v`/`version` as a defensive fallback so this skip can
  // never silently regress if config is somehow unavailable at runtime.
  // NOTE: temporary hook until v12.
  const arg = process.argv[2]
  const additionalVersionFlags = this.config?.pjson?.oclif?.additionalVersionFlags ?? []
  const skip = new Set(['--version', '-v', 'autocomplete', 'version', ...additionalVersionFlags])
  if (!arg || skip.has(arg)) return

  const git = new Git()
  try {
    await git.configureCredentialHelper()
  } catch {
    // ignore — best-effort; never block a command on git config
  }
}

export default hook
