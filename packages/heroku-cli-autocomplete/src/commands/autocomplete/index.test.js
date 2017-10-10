// @flow

import Autocomplete from '.'
import os from 'os'
import cli from 'cli-ux'

// autocomplete will throw error on windows
let skipWindows = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

skipWindows('outputs install instructions for zsh', async () => {
  cli.config.mock = true
  await Autocomplete.mock('zsh')
  expect(cli.stdout.output).toMatch(`Add the autocomplete setup script to your .zshrc via:

$ printf "$(heroku autocomplete:script zsh)" >> ~/.zshrc

Run the following zsh command to ensure no permissions conflicts:

$ compaudit

Lastly, restart your shell`)
})
