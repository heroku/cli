import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('keys:clear', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('removes all SSH keys', async function () {
    api
      .get('/account/keys')
      .reply(200, [{id: 1}, {id: 2}])
      .delete('/account/keys/1')
      .reply(200)
      .delete('/account/keys/2')
      .reply(200)

    const {stderr, stdout} = await runCommand(['keys:clear'])

    expect('').to.equal(stdout)
    expect(stderr).to.contain('Removing all SSH keys... done\n')
  })
})
