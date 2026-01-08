import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('spaces:peerings:accept', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('accepts a pending peering connection', async function () {
    const api = nock('https://api.heroku.com:443')
      .post('/spaces/my-space/peerings', {
        pcx_id: 'pcx-12345',
      })
      .reply(202)

    const {stdout} = await runCommand(['spaces:peerings:accept', '--pcxid', 'pcx-12345', '--space', 'my-space'])

    expect(stdout).to.equal('Accepting and configuring peering connection pcx-12345\n')
    api.done()
  })
})
