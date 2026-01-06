import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('features:info', function () {
  afterEach(() => nock.cleanAll())

  it('shows feature info', async () => {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp/features/feature-a')
      .reply(200, {name: 'myfeature', description: 'the description', doc_url: 'https://devcenter.heroku.com', enabled: true})

    const {stderr, stdout} = await runCommand(['features:info', '-a', 'myapp', 'feature-a'])

    expect(stdout).to.eq(`=== myfeature

Description: the description
Enabled:     true
Docs:        https://devcenter.heroku.com
`)
    expect(stderr).to.equal('')
  })
})
