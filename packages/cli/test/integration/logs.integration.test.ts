import {expect, test} from '@oclif/test'

describe('logs', function () {
  globalThis.setTimeout = globalThis.originalSetTimeout
  test
    .stdout()
    .command(['logs', '--app=heroku-cli-ci-smoke-test-app'])
    .it('shows the logs', ctx => {
      try {
        expect(ctx.stdout.startsWith('20')).to.be.true
      } catch (error: any) {
        throw new Error(`Failed to fetch logs: ${error.message}`)
      }
    })
})
