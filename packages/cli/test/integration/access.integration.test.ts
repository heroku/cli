import {expect, test} from '@oclif/test'

describe('access', function () {
  test
    .stdout()
    .command(['access', '--app=heroku-cli-ci-smoke-test-app'])
    .it('shows a table with access status', ctx => {
      // This is asserting that logs are returned by checking for the presence of the first two
      // digits of the year in the timetstamp
      expect(ctx.stdout.includes('admin')).to.be.true
      expect(ctx.stdout.includes('deploy, manage, operate, view')).to.be.true
    })
})
