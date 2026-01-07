import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('domains:wait', function () {
  afterEach(() => nock.cleanAll())

  it('waits on domain status succeeded', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/domains/example.com')
      .reply(200, {id: 123, hostname: 'example.com', status: 'pending'})
      .get('/apps/myapp/domains/123')
      .reply(200, {id: 123, hostname: 'example.com', status: 'succeeded'})

    const {stderr} = await runCommand(['domains:wait', 'example.com', '--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example.com... done')
  })

  it('waits on domains when no hostname is provided', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/domains')
      .reply(200, [{id: 123, hostname: 'example.com', status: 'pending'}])
      .get('/apps/myapp/domains/123')
      .reply(200, {id: 123, hostname: 'example.com', status: 'succeeded'})

    const {stderr} = await runCommand(['domains:wait', '--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example.com... done')
  })
})
