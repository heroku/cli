import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('sessions:destroy', function () {
  afterEach(() => nock.cleanAll())

  it('destroys the session', async () => {
    nock('https://api.heroku.com:443')
      .delete('/oauth/sessions/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
      .reply(200)

    const {stderr} = await runCommand(['sessions:destroy', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'])

    expect(stderr).to.contain(
      'Destroying f6e8d969-129f-42d2-854b-c2eca9d5a42e... done',
    )
  })
})
