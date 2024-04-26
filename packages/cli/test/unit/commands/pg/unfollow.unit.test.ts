import {stderr} from 'stdout-stderr'
import * as nock from 'nock'
import Cmd  from '../../../../src/commands/pg/unfollow'
import runCommand from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import * as fixtures from '../../../fixtures/addons/fixtures'

describe('pg:unfollow', () => {
  const addon = fixtures.addons['dwh-db']
  const appName = 'myapp'

  afterEach(() => {
    nock.cleanAll()
  })

  it('unfollows db', async () => {
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
    expectOutput(stderr.output, heredoc(`
      ${addon.name} unfollowing...
      ${addon.name} unfollowing... done
    `))
  })
})
