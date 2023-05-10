import {expect, test} from '@oclif/test'

let describeOrSkip: Mocha.SuiteFunction | Mocha.PendingSuiteFunction = describe

if (process.env.CI && process.env.RUN_ACCEPTANCE_TESTS !== 'true') {
  describeOrSkip = describe.skip.bind(describe)
}

describeOrSkip('@acceptance logs', () => {
  test
    .stdout()
    .command(['logs', '--app=heroku-cli-ci-smoke-test-app'])
    .it('shows the logs', ctx => {
    // This is asserting that logs are returned by checking for the presence of the first two
    // digits of the year in the timetstamp
      expect(ctx.stdout.startsWith('20')).to.be.true
    })
})
