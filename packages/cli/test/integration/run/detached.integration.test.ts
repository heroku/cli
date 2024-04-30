import {expect, test} from '@oclif/test'

describe('run:detached', function () {
  test
    .stdout()
    .command(['run:detached', '--app=heroku-cli-ci-smoke-test-app', 'echo 1 2 3'])
    .it('runs a command', ctx => {
      expect(ctx.stdout).to.include('Run heroku logs --app heroku-cli-ci-smoke-test-app --dyno')
    })
})
