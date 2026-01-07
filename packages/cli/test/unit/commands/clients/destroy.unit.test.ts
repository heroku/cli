import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

describe('clients:destroy', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('destroys the client', async function () {
    nock('https://api.heroku.com:443')
      .delete('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
      .reply(200)

    const {stderr} = await runCommand(['clients:destroy', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'])

    expect(stderr).to.contain('Destroying f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
  })
})
