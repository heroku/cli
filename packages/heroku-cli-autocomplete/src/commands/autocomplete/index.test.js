// @flow

import Autocomplete from '.'
import os from 'os'
import cli from 'cli-ux'

// autocomplete will throw error on windows
let skipWindows = (os.platform() === 'windows' || os.platform() === 'win32') ? xtest : test

skipWindows('outputs install instructions for zsh', async () => {
  cli.config.mock = true
  await Autocomplete.mock('zsh')
  expect(cli.stdout.output).toMatch(`Setup Instructions for Heroku CLI Autocomplete ---

1) Add the autocomplete env vars to your zsh profile

$ printf "$(heroku autocomplete:script zsh)" >> ~/.zshrc

2) Run compaudit to ensure no permissions conflicts are present (some versions of zsh may not have this command)

$ compaudit

3) Source your updated zsh profile

$ source ~/.zshrc

4) Test command completion by pressing <TAB>, e.g.:

$ heroku <TAB>

5) Test flag completion by pressing <TAB>, e.g.:

$ heroku apps:info --<TAB>

6) Test flag options completion by pressing <TAB>, e.g.:

$ heroku apps:info --app=<TAB>


To uninstall Heroku CLI Autocomplete:
-- Uninstall this plugin from your CLI (for help see: heroku help plugins:uninstall)
-- Delete the env vars from your zsh profile & restart your terminal


Enjoy!`)
})
