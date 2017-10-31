// @flow

import AutocompleteScript from './script'
import os from 'os'
import cli from 'cli-ux'

// autocomplete will throw error on windows
let runtest = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

cli.config.mock = true

runtest('outputs autocomplete script for .zshrc', async () => {
  let cmd = await AutocompleteScript.mock('zsh')
  expect(cli.stdout.output).toMatch(`
# cli-engine autocomplete setup
CLI_ENGINE_AC_ZSH_SETUP_PATH=${cmd.config.cacheDir}/completions/zsh_setup && test -f $CLI_ENGINE_AC_ZSH_SETUP_PATH && source $CLI_ENGINE_AC_ZSH_SETUP_PATH;
`)
})

runtest('outputs autocomplete script for .bashrc', async () => {
  let cmd = await AutocompleteScript.mock('bash')
  expect(cli.stdout.output).toMatch(`
# cli-engine autocomplete setup
CLI_ENGINE_AC_BASH_SETUP_PATH=${cmd.config.cacheDir}/completions/bash_setup && test -f $CLI_ENGINE_AC_BASH_SETUP_PATH && source $CLI_ENGINE_AC_BASH_SETUP_PATH;
`)
})

runtest('errors on unsupported shell', async () => {
  try {
    await AutocompleteScript.mock('fish')
  } catch (e) {
    expect(cli.stderr.output).toBe(` ▸    No autocomplete script for fish. Run $ cli-engine autocomplete for install instructions.
`)
  }
})
