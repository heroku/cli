import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

describe('clients:rotate', function () {
  const id = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const client = {name: 'awesome', id, redirect_uri: 'https://myapp.com', secret: 'supersecretkey'}

  afterEach(function () {
    nock.cleanAll()
  })

  it('returns the client info', async function () {
    nock('https://api.heroku.com')
      .post(`/oauth/clients/${id}/actions/rotate-credentials`)
      .reply(200, client)

    const {stdout, stderr} = await runCommand(['clients:rotate', id])

    expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
    expect(stdout).to.contain('=== awesome\n')
    expect(stdout).to.contain('id:           f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
    expect(stdout).to.contain('name:         awesome\n')
    expect(stdout).to.contain('redirect_uri: https://myapp.com\n')
    expect(stdout).to.contain('secret:       supersecretkey\n')
  })

  context('with json flag', function () {
    it('returns the client info as json', async function () {
      nock('https://api.heroku.com')
        .post(`/oauth/clients/${id}/actions/rotate-credentials`)
        .reply(200, client)

      const {stdout, stderr} = await runCommand(['clients:rotate', id, '--json'])

      expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      expect(JSON.parse(stdout)).to.contain(client)
    })
  })

  context('with shell flag', function () {
    it('returns the client info as shell', async function () {
      nock('https://api.heroku.com')
        .post(`/oauth/clients/${id}/actions/rotate-credentials`)
        .reply(200, client)

      const {stdout, stderr} = await runCommand(['clients:rotate', id, '--shell'])

      expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      expect(stdout).to.equal(
        'HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=supersecretkey\n',
      )
    })
  })
})
