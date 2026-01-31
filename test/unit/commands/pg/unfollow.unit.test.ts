import {stderr} from 'stdout-stderr'
import nock from 'nock'
import Cmd from '../../../../src/commands/pg/unfollow.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'

describe('pg:unfollow', function () {
  const addon = fixtures.addons['dwh-db']
  const appName = 'myapp'

  afterEach(function () {
    nock.cleanAll()
  })

  it('unfollows db', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get(`/apps/${appName}/config-vars`)
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: 'postgres://db1'})
      .put(`/client/v11/databases/${addon.id}/unfollow`)
      .reply(200)

    await runCommand(Cmd, [
      '--app',
      appName,
      '--confirm',
      appName,
      'DATABASE',
    ])
    expectOutput(stderr.output, `${addon.name} unfollowing... done`)
  })
})
