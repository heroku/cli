import * as Heroku from '@heroku-cli/schema'
import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/unschedule.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:backups:unschedule', function () {
  const shouldUnschedule = function (cmdRun: (args: string[]) => Promise<any>) {
    const addon = fixtures.addons['www-db']
    const attachment = {addon}
    const appName = addon.app?.name || 'myapp'

    beforeEach(function () {
      nock('https://api.heroku.com')
        .get(`/apps/${appName}/addons`)
        .reply(200, [addon])
        .post('/actions/addon-attachments/resolve', {
          addon_attachment: 'DATABASE_URL',
          app: appName,
        })
        .reply(200, [attachment])
      nock('https://api.data.heroku.com')
        .get(`/client/v11/databases/${addon.id}/transfer-schedules`)
        .twice()
        .reply(200, [{name: 'DATABASE_URL', uuid: '100-001'}])
        .delete(`/client/v11/databases/${addon.id}/transfer-schedules/100-001`)
        .reply(200)
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('unschedules a backup', async function () {
      const {stderr, stdout} = await cmdRun(['--app', appName])
      expectOutput(stdout, '')
      expectOutput(stderr, heredoc(`
        Unscheduling ⛁ DATABASE_URL daily backups... done
      `))
    })
  }

  shouldUnschedule((args: string[]) => runCommand(Cmd, args))
})

describe('pg:backups:unschedule error state', function () {
  let addon: Heroku.AddOn
  let attachment
  let appName: string

  beforeEach(function () {
    addon = fixtures.addons['www-db']
    attachment = {addon}
    appName = addon.app?.name || 'myapp'
    nock('https://api.heroku.com')
      .get(`/apps/${appName}/addons`)
      .reply(200, [addon])
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE_URL',
        app: appName,
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

  afterEach(function () {
    nock.cleanAll()
  })

  it('errors when multiple schedules are returned from API', async function () {
    const {error} = await runCommand(Cmd, ['--app', appName])
    expect(ansis.strip(error!.message)).to.equal(`Specify schedule on ⬢ ${appName}. Existing schedules: ⛁ DATABASE_URL, ⛁ DATABASE_URL2`)
  })
})
