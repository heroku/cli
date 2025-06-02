import {expect} from 'chai'
import {runCommand} from '@oclif/test'

describe('2fa:disable remove', function () {
  it('shows error when trying to disable 2fa', async function () {
    try {
      await runCommand(['2fa:disable'])
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.contain('this command has been removed, in favor of disabling MFA in your Account Settings in a browser: https://dashboard.heroku.com/account')
      }
    }
  })
})
