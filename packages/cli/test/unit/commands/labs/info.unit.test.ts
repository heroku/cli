import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

describe('labs:info', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows user labs feature info', async function () {
    nock('https://api.heroku.com')
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })

    const {stdout, stderr} = await runCommand(['labs:info', 'feature-a'])

    expect(stdout).to.equal('=== feature-a\n\nDescription: a user lab feature\nEnabled:     true\nDocs:        https://devcenter.heroku.com\n')
    expect(stderr).to.be.empty
  })

  it('shows user labs feature info as json', async function () {
    nock('https://api.heroku.com')
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })

    const {stdout, stderr} = await runCommand(['labs:info', 'feature-a', '--json'])

    expect(stdout).to.equal('{\n  "enabled": true,\n  "name": "feature-a",\n  "description": "a user lab feature",\n  "doc_url": "https://devcenter.heroku.com"\n}\n')
    expect(stderr).to.be.empty
  })

  it('shows app labs feature info', async function () {
    nock('https://api.heroku.com')
      .get('/account/features/feature-a').reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'an app labs feature',
        doc_url: 'https://devcenter.heroku.com',
      })

    const {stdout, stderr} = await runCommand(['labs:info', 'feature-a', '-a', 'myapp'])

    expect(stdout).to.equal('=== feature-a\n\nDescription: an app labs feature\nEnabled:     true\nDocs:        https://devcenter.heroku.com\n')
    expect(stderr).to.be.empty
  })
})
