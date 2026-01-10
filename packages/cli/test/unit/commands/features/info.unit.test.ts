import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('features:info', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows feature info', async function () {
    api
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        description: 'the description',
        doc_url: 'https://devcenter.heroku.com',
        enabled: true,
        name: 'myfeature',
      })

    const {stderr, stdout} = await runCommand(['features:info', '-a', 'myapp', 'feature-a'])

    expect(stdout).to.eq(`=== myfeature

Description: the description
Enabled:     true
Docs:        https://devcenter.heroku.com
`)
    expect(stderr).to.equal('')
  })
})
