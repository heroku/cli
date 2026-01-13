import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('access', function () {
  // skipped due to account access issues with heroku-cli-ci-smoke-test-app
  it.skip('shows a table with access status', async function () {
    // This is asserting that logs are returned by checking for the presence of the first two
    // digits of the year in the timestamp
    const {stdout} = await runCommand(['access', '--app=heroku-cli-ci-smoke-test-app'])
    expect(stdout.includes('admin')).to.be.true
    expect(stdout.includes('deploy, manage, operate, view')).to.be.true
  })
})
