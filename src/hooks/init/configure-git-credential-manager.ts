import {Hook} from '@oclif/core/hooks'

import Git from '../../lib/git/git.js'

const hook: Hook.Init = async function () {
  // Skip for --version / --help / completion-style invocations to avoid a needless git subprocess.
  // Version-style invocations include `--version` plus any `oclif.additionalVersionFlags`
  // (e.g. `-v`, `version`) declared in package.json — mirror version.ts, which reads the
  // same config. We hard-include `-v`/`version` as a defensive fallback so this skip can
  // never silently regress if config is somehow unavailable at runtime.
  // Help-style invocations are skipped for the same reason: they're fast informational
  // commands that shouldn't touch git. They include `--help` plus any
  // `oclif.additionalHelpFlags` (e.g. `-h`) declared in package.json, and we hard-include
  // `--help`/`-h`/`help` as the same kind of defensive fallback.
  // Completion invocations are matched by the `autocomplete` prefix, since shell completion
  // actually runs `autocomplete:options` (not the bare `autocomplete` command).
  // NOTE: temporary hook until v12.
  const arg = process.argv[2]
  const additionalVersionFlags = this.config?.pjson?.oclif?.additionalVersionFlags ?? []
  const additionalHelpFlags = this.config?.pjson?.oclif?.additionalHelpFlags ?? []
  const skip = new Set([
    '--help',
    '--version',
    '-h',
    '-v',
    'help',
    'version',
    ...additionalHelpFlags,
    ...additionalVersionFlags,
  ])
  if (!arg || skip.has(arg) || arg.startsWith('autocomplete')) return

  const git = new Git()
  try {
    await git.configureCredentialHelper()
  } catch {
    // ignore — best-effort; never block a command on git config
  }
}

export default hook
