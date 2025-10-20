import {expect} from 'chai'
import Cmd from '../../../../src/commands/auth/2fa/disable.js'
import runCommand from '../../../helpers/runCommand.js'

describe('2fa:disable remove', function () {
  it('shows error when trying to disable 2fa', async function () {
    try {
      await runCommand(Cmd, ['2fa:disable'])
      expect.fail('Expected command to throw an error')
    } catch (error: any) {
      expect(error.message).to.contain('this command has been removed, in favor of disabling MFA in your Account Settings in a browser: https://dashboard.heroku.com/account')
    }
  })
})
