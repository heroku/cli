import {expect, test} from '@oclif/test'

describe('logs', () => {
  test
    .stdout()
    .command(['logs', '--app=heroku-cli-ci-smoke-test-app'])
    .it('shows the logs', ctx => {
    // This is asserting that logs are returned by checking for the presence of the first two
    // digits of the year in the timestamp
      expect(ctx.stdout.startsWith('20')).to.be.true
    })
})
