// @flow

import Autocomplete from '.'
import os from 'os'

// autocomplete will throw error on windows
let skipWindows = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

skipWindows('outputs install instructions for zsh', async () => {
  let cmd = await Autocomplete.mock('zsh')
  expect(cmd.out.stdout.output).toMatch(`Add the autocomplete setup script to your .zshrc via:

$ printf $(heroku autocomplete:script zsh) >> ~/.zshrc

Run the following zsh command to ensure no permissions conflicts:

$ compaudit

Lastly, restart your shell`)
})
