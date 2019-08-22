import {expect, test} from '@oclif/test'

describe('logs', () => {
  test
    .stdout()
    .command(['_logs', '--app=heroku-run-test-app'])
    .it('shows the logs', ctx => {
      // This is asserting that logs are returned by checking for the presence of the first two
      // digits of the year in the timetstamp
      expect(ctx.stdout).to.match(/^20/)
    })
})
