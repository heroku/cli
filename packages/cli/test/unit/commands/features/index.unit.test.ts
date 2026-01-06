import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('features', function () {
  afterEach(() => nock.cleanAll())

  it('shows the app features', async () => {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp/features')
      .reply(200, [
        {enabled: true, state: 'general', name: 'feature a', description: 'an app feature'},
      ])

    const {stdout, stderr} = await runCommand(['features', '--app', 'myapp'])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(`=== App Features ⬢ myapp

[+] feature a  an app feature
`)
  })
})
