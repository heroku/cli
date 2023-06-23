import {expect, test} from '@oclif/test'

describe('detached', () => {
  test
    .stdout()
    .command(['run:detached', '--app=heroku-cli-ci-smoke-test-app', 'test'])
    .it('sucessfully runs detached', ctx => {
      const rawResponse = ctx.stdout
      const updatedDynoNameResponse = rawResponse.replace(/run\.\d{4}/g, 'test-dyno')
      expect(updatedDynoNameResponse).to.equal('Run heroku logs --app heroku-cli-ci-smoke-test-app --dyno test-dyno to view the output.\n')
    })

  test
    .stdout()
    .command(['run:detached', '--app=heroku-cli-ci-smoke-test-app'])
    .catch(error => {
      expect(error.message).to.equal('Usage: heroku run COMMAND\n\nExample: heroku run bash')
    })
    .it('errors if no arguments are provided')
})
