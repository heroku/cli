// @flow

import AutocompleteScript from './script'
import os from 'os'
import cli from 'cli-ux'

// autocomplete will throw error on windows
let skipWindows = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

skipWindows('outputs autocomplete script for .zshrc', async () => {
  cli.config.mock = true
  await AutocompleteScript.mock('zsh')
  expect(cli.stdout.output).toMatch(/\\n# heroku autocomplete setup\\nHEROKU_ZSH_AC_SETUP_PATH=(.+)\/completions\/zsh_setup && test -f \$HEROKU_ZSH_AC_SETUP_PATH && source \$HEROKU_ZSH_AC_SETUP_PATH;\n/)
})
