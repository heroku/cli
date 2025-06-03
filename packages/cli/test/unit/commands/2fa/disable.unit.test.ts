import {expect, test} from '@oclif/test'

describe('2fa:disable remove', function () {
  test
    .command(['2fa:disable'])
    .catch(error => {
      expect(error.message).to.contain('this command has been removed, in favor of disabling MFA in your Account Settings in a browser: https://dashboard.heroku.com/account')
    })
    .it('shows error when trying to disable 2fa')
})
