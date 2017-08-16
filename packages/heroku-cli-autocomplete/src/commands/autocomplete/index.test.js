// @flow

import Autocomplete from '.'
import os from 'os'

// autocomplete will throw error on windows
let skipWindows = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

skipWindows('outputs install instructions for zsh', async () => {
  let cmd = await Autocomplete.mock('zsh')
  expect(cmd.out.stdout.output).toMatch(/heroku autocomplete:script zsh/)
})
