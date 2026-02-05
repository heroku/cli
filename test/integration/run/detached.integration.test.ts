import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('run:detached', function () {
  it.skip('runs a command', async function () {
    const {stdout} = await runCommand(['run:detached', '--app=heroku-cli-ci-smoke-test-app', 'echo', '1', '2', '3'])
    expect(stdout).to.include('Run heroku logs --app heroku-cli-ci-smoke-test-app --dyno')
  })
})
