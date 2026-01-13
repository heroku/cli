import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('logs', function () {
  it.skip('shows the logs', async function () {
    // This is asserting that logs are returned by checking for the presence of the first two
    // digits of the year in the timestamp
    const {stdout} = await runCommand(['logs', '--app=heroku-cli-ci-smoke-test-app'])
    expect(stdout.startsWith('20')).to.be.true
  })
})
