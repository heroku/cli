import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('clients:create', function () {
  let api: nock.Scope

  const createResponse = {
    id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
    name: 'awesome',
    redirect_uri: 'https://myapp.com',
    secret: 'clientsecret',
  }

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('creates the client and outputs id and secret', async function () {
    api
      .post('/oauth/clients', {
        name: 'awesome',
        redirect_uri: 'https://myapp.com',
      })
      .reply(201, createResponse)

    const {stderr, stdout} = await runCommand(['clients:create', 'awesome', 'https://myapp.com'])

    expect(stdout).to.equal(
      'HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=clientsecret\n',
    )
    expect(stderr).to.contain('Creating awesome... done\n')
  })

  it('creates the client and outputs json', async function () {
    api
      .post('/oauth/clients', {
        name: 'awesome',
        redirect_uri: 'https://myapp.com',
      })
      .reply(201, createResponse)

    const {stderr, stdout} = await runCommand(['clients:create', 'awesome', 'https://myapp.com', '--json'])

    expect(JSON.parse(stdout)).to.contain(createResponse)
    expect(stderr).to.contain('Creating awesome... done\n')
  })
})
