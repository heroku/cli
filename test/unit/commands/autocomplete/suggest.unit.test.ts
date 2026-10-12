import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'

import Suggest from '../../../../src/commands/autocomplete/__suggest.js'

/**
 * The network/auth-backed path (a real `--flag app`) is intentionally NOT
 * exercised here — it would hit the SDK and depend on the dev machine's auth.
 * These cover the degradation guards that must hold with no network at all:
 * __suggest must stay silent and never throw for a stale/mismatched script.
 */
describe('autocomplete:__suggest', function () {
  it('prints nothing and does not throw when no --flag is given', async function () {
    // strict = false + optional --flag: an old generated script invoking the
    // command bare must degrade to no suggestions.
    const {stdout} = await runCommand(Suggest, [])
    expect(stdout).to.equal('')
  })

  it('prints nothing for an unknown flag (no completion registered)', async function () {
    const {stdout} = await runCommand(Suggest, ['--flag', 'does-not-exist'])
    expect(stdout).to.equal('')
  })

  it('ignores prototype keys rather than resolving them as completions', async function () {
    // Object.hasOwn guards against `--flag __proto__` resolving to a non-Completion.
    const {stdout} = await runCommand(Suggest, ['--flag', '__proto__'])
    expect(stdout).to.equal('')
  })
})
