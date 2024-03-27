import {stderr, stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/unschedule'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import {expect} from 'chai'
import expectOutput from '../../../../helpers/utils/expectOutput'
import * as fixtures from '../../../../fixtures/addons/fixtures'
import stripAnsi = require('strip-ansi')

const shouldUnschedule = function (cmdRun: (args: string[]) => Promise<any>) {
  const addon = fixtures.addons['www-db']
  const attachment = {addon}
  const appName = addon.app?.name || 'myapp'

  beforeEach(() => {
    nock('https://api.heroku.com')
      .get(`/apps/${appName}/addons`)
      .reply(200, [addon])
      .post('/actions/addon-attachments/resolve', {
        app: appName,
        addon_attachment: 'DATABASE_URL',
        addon_service: 'heroku-postgresql',
      })
      .reply(200, [attachment])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/transfer-schedules`)
      .twice()
      .reply(200, [{name: 'DATABASE_URL', uuid: '100-001'}])
      .delete(`/client/v11/databases/${addon.id}/transfer-schedules/100-001`)
      .reply(200)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('unschedules a backup', async () => {
    await cmdRun(['--app', appName])
    expectOutput(stdout.output, '')
    expectOutput(stderr.output, heredoc(`
      Unscheduling DATABASE_URL daily backups...
      Unscheduling DATABASE_URL daily backups... done
    `))
  })
}

describe('pg:backups:unschedule', () => {
  shouldUnschedule((args: string[]) => runCommand(Cmd, args))
})

describe('pg:backups:unschedule error state', () => {
  const addon = fixtures.addons['www-db']
  const attachment = {addon}
  const appName = addon.app?.name || 'myapp'

  beforeEach(() => {
    nock('https://api.heroku.com')
      .get(`/apps/${appName}/addons`)
      .reply(200, [addon])
      .post('/actions/addon-attachments/resolve', {
        app: appName,
        addon_attachment: 'DATABASE_URL',
        addon_service: 'heroku-postgresql',
      })
      .reply(200, [attachment])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/transfer-schedules`)
      .twice()
      .reply(200, [
        {
          name: 'DATABASE_URL',
          uuid: '100-001',
        },
        {
          name: 'DATABASE_URL2',
          uuid: '100-002',
        },
      ])
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('errors when multiple schedules are returned from API', async () => {
    await runCommand(Cmd, ['--app', appName])
      .catch(error => expect(stripAnsi(error.message)).to.equal(`Specify schedule on ${appName}. Existing schedules: DATABASE_URL, DATABASE_URL2`))
  })
})
