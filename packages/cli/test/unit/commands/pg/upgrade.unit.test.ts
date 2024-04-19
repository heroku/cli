import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/pg/upgrade'
import runCommand from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import * as fixtures from '../../../fixtures/addons/fixtures'

describe('pg:upgrade', () => {
  const hobbyAddon = fixtures.addons['www-db']
  const addon = fixtures.addons['dwh-db']

  afterEach(() => {
    nock.cleanAll()
  })

  it('refuses to upgrade legacy essential dbs', async () => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.equal('pg:upgrade is only available for Essential-* databases and follower databases on Standard-tier and higher plans.')
    })
  })

  it('upgrades db', async () => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: 'postgres://db1'})
      .post(`/client/v11/databases/${addon.id}/upgrade`)
      .reply(200)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(stderr.output, heredoc(`
      Starting upgrade of ${addon.name}...
      Starting upgrade of ${addon.name}... Use heroku pg:wait to track status
    `))
  })

  it('upgrades db with version flag', async () => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/config-vars')
      .reply(200, {DATABASE_URL: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: 'postgres://db1'})
    nock('https://api.data.heroku.com')
      .post(`/client/v11/databases/${addon.id}/upgrade`)
      .reply(200)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      '--version',
      '9.6',
    ])
    expectOutput(stderr.output, heredoc(`
      Starting upgrade of ${addon.name}...
      Starting upgrade of ${addon.name}... Use heroku pg:wait to track status
    `))
  })
})
