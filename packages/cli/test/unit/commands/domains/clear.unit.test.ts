import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('domains:clear', function () {
  afterEach(() => nock.cleanAll())

  it('clears domains all domains', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/domains')
      .reply(200, [{hostname: 'example.com', kind: 'custom'}])
      .delete('/apps/myapp/domains/example.com')
      .reply(200, {})

    const {stderr} = await runCommand(['domains:clear', '--app', 'myapp'])

    expect(stderr).to.contain('Removing all domains from ⬢ myapp... done')
  })
})
