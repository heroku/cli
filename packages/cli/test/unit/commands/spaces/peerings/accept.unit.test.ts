import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('spaces:peerings:accept', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('accepts a pending peering connection', async function () {
    api
      .post('/spaces/my-space/peerings', {
        pcx_id: 'pcx-12345',
      })
      .reply(202)

    const {stdout} = await runCommand(['spaces:peerings:accept', '--pcxid', 'pcx-12345', '--space', 'my-space'])

    expect(stdout).to.equal('Accepting and configuring peering connection pcx-12345\n')
  })
})
