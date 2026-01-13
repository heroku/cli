import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('labs:info', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows user labs feature info', async function () {
    api
      .get('/account/features/feature-a')
      .reply(200, {
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
        enabled: true,
        name: 'feature-a',
      })

    const {stderr, stdout} = await runCommand(['labs:info', 'feature-a'])

    expect(stdout).to.equal('=== feature-a\n\nDescription: a user lab feature\nEnabled:     true\nDocs:        https://devcenter.heroku.com\n')
    expect(stderr).to.be.empty
  })

  it('shows user labs feature info as json', async function () {
    api
      .get('/account/features/feature-a')
      .reply(200, {
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
        enabled: true,
        name: 'feature-a',
      })

    const {stderr, stdout} = await runCommand(['labs:info', 'feature-a', '--json'])

    expect(stdout).to.equal(`{
  "description": "a user lab feature",
  "doc_url": "https://devcenter.heroku.com",
  "enabled": true,
  "name": "feature-a"
}
`)
    expect(stderr).to.be.empty
  })

  it('shows app labs feature info', async function () {
    api
      .get('/account/features/feature-a').reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        description: 'an app labs feature',
        doc_url: 'https://devcenter.heroku.com',
        enabled: true,
        name: 'feature-a',
      })

    const {stderr, stdout} = await runCommand(['labs:info', 'feature-a', '-a', 'myapp'])

    expect(stdout).to.equal('=== feature-a\n\nDescription: an app labs feature\nEnabled:     true\nDocs:        https://devcenter.heroku.com\n')
    expect(stderr).to.be.empty
  })
})
