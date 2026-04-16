import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/schedules.js'

const heredoc = tsheredoc.default
const shouldSchedules = function (cmdRun: (args: string[]) => Promise<any>) {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows empty message with no databases', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addons')
      .reply(200, [])
    const {error} = await cmdRun(['--app', 'myapp'])
    expect(error.message).to.equal('No Heroku Postgres legacy database on myapp')
  })

  context('with databases', function () {
    beforeEach(function () {
      nock('https://api.heroku.com')
        .get('/apps/myapp/addons')
        .reply(200, [
          {
            app: {name: 'myapp'}, id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
          },
        ])
    })

    it('shows empty message with no schedules', async function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/databases/1/transfer-schedules')
        .reply(200, [])
      const {stderr} = await cmdRun(['--app', 'myapp'])
      expect(stderr).to.include('Warning: No backup schedules found on ⬢ myapp')
      expect(stderr).to.include('Use heroku pg:backups:schedule to set one up')
    })

    it('shows schedule', async function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/databases/1/transfer-schedules')
        .reply(200, [
          {hour: 5, name: 'DATABASE_URL', timezone: 'UTC'},
        ])
      const {stdout} = await cmdRun(['--app', 'myapp'])
      expectOutput(stdout, heredoc(`
        === Backup Schedules
        DATABASE_URL: daily at 5:00 UTC
      `))
    })
  })
}

describe('pg:backups:schedules', function () {
  shouldSchedules((args: string[]) => runCommand(Cmd, args))
})
