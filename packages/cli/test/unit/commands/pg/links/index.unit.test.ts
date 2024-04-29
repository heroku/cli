import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import Cmd from '../../../../../src/commands/pg/links/index'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'
import * as fixtures from '../../../../fixtures/addons/fixtures'

describe('pg:links', function () {
  const addon = fixtures.addons['www-db']
  const appName = 'myapp'
  const redisLink = {
    name: 'redis-link-1',
    created_at: '100',
    remote: {
      attachment_name: 'REDIS',
      name: 'redis-001',
    },
  }

  afterEach(function () {
    nock.cleanAll()
  })

  it('shows links', async function () {
    nock('https://api.heroku.com')
      .get(`/apps/${appName}/addon-attachments`)
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/links`)
      .reply(200, [redisLink])

    await runCommand(Cmd, [
      '--app',
      appName,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (redis-001)
    `))
  })

  it('shows links when args are present', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/links`)
      .reply(200, [redisLink])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'test-database',
    ])
    expectOutput(stdout.output, heredoc(`
      === ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (redis-001)
    `))
  })
})
