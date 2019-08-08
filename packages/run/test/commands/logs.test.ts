import {expect, test} from '@oclif/test'

describe('logs', () => {
  test
    .stdout()
    .command(['logs', '--app=heroku-run-test-app'])
    .it('shows the logs', ctx => {
      expect(ctx.stdout).to.match(/^20/)
    })
})
