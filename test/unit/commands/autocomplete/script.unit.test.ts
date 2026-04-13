import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'

import AutocompleteScript from '../../../../src/commands/autocomplete/script.js'
import {default as runtest} from '../../../helpers/autocomplete/runtest.js'
import {getConfig} from '../../../helpers/test-instances.js'

runtest('autocomplete:script', () => {
  it('outputs bash profile config', async function () {
    const config = await getConfig()
    const {stdout} = await runCommand(AutocompleteScript, ['bash'])

    expect(stdout).to.contain(`
# heroku autocomplete setup
HEROKU_AC_BASH_SETUP_PATH=${
  config.cacheDir
}/autocomplete/bash_setup && test -f $HEROKU_AC_BASH_SETUP_PATH && source $HEROKU_AC_BASH_SETUP_PATH;
`)
  })

  it('outputs zsh profile config', async function () {
    const config = await getConfig()
    const {stdout} = await runCommand(AutocompleteScript, ['zsh'])

    expect(stdout).to.contain(`
# heroku autocomplete setup
HEROKU_AC_ZSH_SETUP_PATH=${
  config.cacheDir
}/autocomplete/zsh_setup && test -f $HEROKU_AC_ZSH_SETUP_PATH && source $HEROKU_AC_ZSH_SETUP_PATH;
`)
  })

  it('errors on unsupported shell', async function () {
    const {error} = await runCommand(AutocompleteScript, ['fish'])

    expect(error?.message).to.contain('fish is not a supported shell for autocomplete')
  })
})
