import {expect, test} from '@oclif/test'

describe('run:detached', () => {
  test
    .stdout()
    .command(['run:detached', '--app=heroku-run-test-app', 'echo 1 2 3'])
    .it('runs a command', ctx => {
      expect(ctx.stdout).to.include('Run heroku logs --app heroku-run-test-app --dyno')
    })
})
