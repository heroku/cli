import { cli } from 'cli-ux'
import * as os from 'os'

import Autocomplete from '.'

// autocomplete will throw error on windows
let runtest = (os.platform() as any) === 'windows' || os.platform() === 'win32' ? xtest : test

cli.config.mock = true

runtest('outputs install instructions for zsh', async () => {
  await Autocomplete.mock(['zsh'])
  expect(cli.stdout.output).toMatch(`Setup Instructions for CLI-ENGINE CLI Autocomplete ---

1) Add the autocomplete env var to your zsh profile

$ printf "$(cli-engine autocomplete:script zsh)" >> ~/.zshrc

2) Source your updated zsh profile

$ source ~/.zshrc

NOTE: After sourcing, you can run \`$ compaudit -D\` to ensure no permissions conflicts are present

3) Test command completion by pressing <TAB>, e.g.:

$ cli-engine <TAB>

4) Test flag completion by pressing <TAB>, e.g.:

$ cli-engine apps:info --<TAB>

5) Test flag options completion by pressing <TAB>, e.g.:

$ cli-engine apps:info --app=<TAB>


To uninstall CLI-ENGINE CLI Autocomplete:
-- Uninstall this plugin from your CLI (for help see: cli-engine help plugins:uninstall)
-- Delete the env var from your zsh profile & restart your terminal


Enjoy!`)
})

runtest('outputs install instructions for bash', async () => {
  await Autocomplete.mock(['bash'])
  expect(cli.stdout.output).toMatch(`Setup Instructions for CLI-ENGINE CLI Autocomplete ---

1) Add the autocomplete env var to your bash profile

$ printf "$(cli-engine autocomplete:script bash)" >> ~/.bashrc

2) Source your updated bash profile

$ source ~/.bashrc

3) Test command completion by pressing <TAB><TAB>, e.g.:

$ cli-engine <TAB><TAB>

4) Test flag completion by pressing <TAB><TAB>, e.g.:

$ cli-engine apps:info --<TAB><TAB>

5) Test flag options completion by pressing <TAB><TAB>, e.g.:

$ cli-engine apps:info --app=<TAB><TAB>


To uninstall CLI-ENGINE CLI Autocomplete:
-- Uninstall this plugin from your CLI (for help see: cli-engine help plugins:uninstall)
-- Delete the env var from your bash profile & restart your terminal


Enjoy!`)
})

runtest('skips instructions', async () => {
  await Autocomplete.mock(['--skip-instructions'])
  expect(cli.stdout.output).toMatch(`
Enjoy!`)
})

runtest('errors on unsupported shell', async () => {
  try {
    await Autocomplete.mock(['fish'])
  } catch (e) {
    expect(cli.stderr.output).toMatch(` ▸    Currently fish is not a supported shell for autocomplete
`)
  }
})
