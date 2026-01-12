import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('domains:wait', function () {  
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('waits on domain status succeeded', async function () {
    api
      .get('/apps/myapp/domains/example.com')
      .reply(200, {hostname: 'example.com', id: 123, status: 'pending'})
      .get('/apps/myapp/domains/123')
      .reply(200, {hostname: 'example.com', id: 123, status: 'succeeded'})

    const {stderr} = await runCommand(['domains:wait', 'example.com', '--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example.com... done')
  })

  it('waits on domains when no hostname is provided', async function () {
    api
      .get('/apps/myapp/domains')
      .reply(200, [{hostname: 'example.com', id: 123, status: 'pending'}])
      .get('/apps/myapp/domains/123')
      .reply(200, {hostname: 'example.com', id: 123, status: 'succeeded'})

    const {stderr} = await runCommand(['domains:wait', '--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example.com... done')
  })
})
