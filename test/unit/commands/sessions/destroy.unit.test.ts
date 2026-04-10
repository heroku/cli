import {expect} from 'chai'
import nock from 'nock'

import SessionsDestroy from '../../../../src/commands/sessions/destroy.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('sessions:destroy', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('destroys the session', async function () {
    api
      .delete('/oauth/sessions/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
      .reply(200)

    const {stderr} = await runCommand(SessionsDestroy, ['f6e8d969-129f-42d2-854b-c2eca9d5a42e'])

    expect(stderr).to.contain('Destroying f6e8d969-129f-42d2-854b-c2eca9d5a42e... done')
  })
})
