import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('domains:remove', function () {
  afterEach(() => nock.cleanAll())

  it('removes a single domain provided by an argument', async () => {
    nock('https://api.heroku.com')
      .delete('/apps/myapp/domains/example.com')
      .reply(200, {})

    const {stderr} = await runCommand(['domains:remove', 'example.com', '--app', 'myapp'])

    expect(stderr).to.contain('Removing example.com from ⬢ myapp... done')
  })
})
