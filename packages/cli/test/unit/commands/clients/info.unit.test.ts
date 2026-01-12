import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('clients:info', function () {
  let api: nock.Scope
  const id = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const client = {
    id,
    name: 'awesome',
    redirect_uri: 'https://myapp.com',
    secret: 'supersecretkey',
  }

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('gets the client info', async function () {
    api
      .get('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
      .reply(200, client)

    const {stdout} = await runCommand(['clients:info', id])

    expect(stdout).to.contain('=== awesome\n')
    expect(stdout).to.contain('id:           f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
    expect(stdout).to.contain('name:         awesome\n')
    expect(stdout).to.contain('redirect_uri: https://myapp.com\n')
    expect(stdout).to.contain('secret:       supersecretkey\n')
  })

  context('with json flag', function () {
    it('gets the client info as json', async function () {
      api
        .get('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
        .reply(200, client)

      const {stdout} = await runCommand(['clients:info', id, '--json'])

      expect(JSON.parse(stdout)).to.contain(client)
    })
  })

  context('with shell flag', function () {
    it('gets the client info as shell', async function () {
      api
        .get('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
        .reply(200, client)

      const {stdout} = await runCommand(['clients:info', id, '--shell'])

      expect(stdout).to.equal(
        'HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=supersecretkey\n',
      )
    })
  })
})
