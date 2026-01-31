import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('features', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows the app features', async function () {
    api
      .get('/apps/myapp/features')
      .reply(200, [
        {
          description: 'an app feature',
          enabled: true,
          name: 'feature a',
          state: 'general',
        },
      ])

    const {stderr, stdout} = await runCommand(['features', '--app', 'myapp'])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(`=== App Features ⬢ myapp

[+] feature a  an app feature
`)
  })
})
