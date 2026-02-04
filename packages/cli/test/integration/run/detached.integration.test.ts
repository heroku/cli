import {runCommand} from '@oclif/test'
import {expect} from 'chai'

const skipWithoutAuth = process.env.HEROKU_API_KEY ? it : it.skip
describe('run:detached', function () {
  skipWithoutAuth('runs a command', async function () {
    const {stdout, stderr} = await runCommand(['run:detached', '--app=heroku-cli-ci-smoke-test-app', 'echo', '1', '2', '3'])
    const out = stdout + stderr
    expect(out).to.include('Run heroku logs --app heroku-cli-ci-smoke-test-app --dyno')
  })
})
