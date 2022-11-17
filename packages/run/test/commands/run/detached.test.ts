import {expect, test} from '@oclif/test'

let describeOrSkip: Mocha.SuiteFunction | Mocha.PendingSuiteFunction = describe

if (process.env.CI && process.env.RUN_ACCEPTANCE_TESTS !== 'true') {
  describeOrSkip = describe.skip.bind(describe)
}

describeOrSkip('@acceptance run:detached', () => {
  test
  .stdout()
  .command(['run:detached', '--app=heroku-cli-ci-smoke-test-app', 'echo 1 2 3'])
  .it('runs a command', ctx => {
    expect(ctx.stdout).to.include('Run heroku logs --app heroku-cli-ci-smoke-test-app --dyno')
  })

  test
  .command(['run:detached', '--size=free', '--app=heroku-cli-ci-smoke-test-app', 'echo 1 2 3'])
  .catch(error => {
    expect(error.message).to.include('Free dynos are no longer available.')
  })
  .it('errors if free flag is passed')
})
