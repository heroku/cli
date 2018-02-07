import { cli } from 'cli-ux'
import * as os from 'os'

import Autocomplete from '.'

// autocomplete will throw error on windows
let runtest = (os.platform() as any) === 'windows' || os.platform() === 'win32' ? xtest : test

cli.config.mock = true

runtest('outputs install instructions for zsh', async () => {
  await Autocomplete.mock(['zsh'])
  expect(cli.stdout.output).toMatch(`
Setup Instructions for CLI-ENGINE CLI Autocomplete ---

1) Add the autocomplete env var to your zsh profile and source it
$ printf \"$(cli-engine autocomplete:script zsh)\" >> ~/.zshrc; source ~/.zshrc

NOTE: After sourcing, you can run \`$ compaudit -D\` to ensure no permissions conflicts are present

2) Test it out, e.g.:
$ cli-engine <TAB>                 # Command completion
$ cli-engine apps:info --<TAB>     # Flag completion
$ cli-engine apps:info --app=<TAB> # Flag option completion

Visit the autocomplete Dev Center doc at https://devcenter.heroku.com/articles/heroku-cli-autocomplete

Enjoy!

`)
})

runtest('outputs install instructions for bash', async () => {
  await Autocomplete.mock(['bash'])
  expect(cli.stdout.output).toMatch(`
Setup Instructions for CLI-ENGINE CLI Autocomplete ---

1) Add the autocomplete env var to your bash profile and source it
$ printf \"$(cli-engine autocomplete:script bash)\" >> ~/.bashrc; source ~/.bashrc

NOTE: If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.

2) Test it out, e.g.:
$ cli-engine <TAB><TAB>                 # Command completion
$ cli-engine apps:info --<TAB><TAB>     # Flag completion
$ cli-engine apps:info --app=<TAB><TAB> # Flag option completion

Visit the autocomplete Dev Center doc at https://devcenter.heroku.com/articles/heroku-cli-autocomplete

Enjoy!

`)
})

runtest('skips instructions', async () => {
  await Autocomplete.mock(['bash', '--skip-instructions'])
  expect(cli.stdout.output).toMatch(``)
})

runtest('errors on unsupported shell', async () => {
  try {
    await Autocomplete.mock(['fish'])
  } catch (e) {
    expect(cli.stderr.output).toMatch(` ▸    Currently fish is not a supported shell for autocomplete
`)
  }
})
