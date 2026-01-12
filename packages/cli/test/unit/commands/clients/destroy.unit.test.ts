import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('clients:destroy', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('destroys the client', async function () {
    api
      .delete('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
      .reply(200)

    const {stderr} = await runCommand(['clients:destroy', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'])

    expect(stderr).to.contain('Destroying f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
  })
})
