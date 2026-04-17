import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'

import Disable from '../../../../src/commands/auth/2fa/disable.js'

describe('2fa:disable remove', function () {
  it('shows error when trying to disable 2fa', async function () {
    const {error} = await runCommand(Disable, [])
    expect(error?.message).to.contain('this command has been removed, in favor of disabling MFA in your Account Settings in a browser: https://dashboard.heroku.com/account')
  })
})
