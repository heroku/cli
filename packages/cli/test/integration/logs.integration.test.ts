import {runCommand} from '@oclif/test'
import {expect} from 'chai'

const skipWithoutAuth = process.env.HEROKU_API_KEY ? it : it.skip
describe('logs', function () {
  skipWithoutAuth('shows the logs', async function () {
    const {stdout, stderr} = await runCommand(['logs', '--app=heroku-cli-ci-smoke-test-app'])
    const out = stdout + stderr
    expect(out.startsWith('20') || out.includes('20')).to.be.true
  })
})
