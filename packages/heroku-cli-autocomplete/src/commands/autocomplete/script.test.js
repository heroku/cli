// @flow

import AutocompleteScript from './script'
import os from 'os'

// autocomplete will throw error on windows
let skipWindows = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

skipWindows('outputs autocomplete script for .zshrc', async () => {
  let cmd = await AutocompleteScript.mock('zsh')
  expect(cmd.out.stdout.output).toMatch(/\/cli-engine\/completions\/zsh_setup/)
  expect(cmd.out.stdout.output).toMatch(/&& source \$HEROKU_ZSH_AC_SETUP_PATH/)
})
