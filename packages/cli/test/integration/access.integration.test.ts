import {runCommand} from '@oclif/test'
import {expect} from 'chai'

const skipWithoutAuth = process.env.HEROKU_API_KEY ? it : it.skip
describe('access', function () {
  skipWithoutAuth('shows a table with access status', async function () {
    const {stdout, stderr} = await runCommand(['access', '--app=heroku-cli-ci-smoke-test-app'])
    const out = stdout + stderr
    expect(out.includes('admin')).to.be.true
    expect(out.includes('deploy, manage, operate, view')).to.be.true
  })
})
