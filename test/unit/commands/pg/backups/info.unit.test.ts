import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/info.js'

const heredoc = tsheredoc.default
const shouldInfo = function (cmdRun: (args: string[]) => Promise<any>) {
  afterEach(function () {
    nock.cleanAll()
  })

  context('without specifying a backup and no backups', function () {
    beforeEach(function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/apps/myapp/transfers')
        .reply(200, [])
    })

    it('shows error message', async function () {
      const {error} = await cmdRun(['--app', 'myapp'])
      expect(ansis.strip(error.message)).to.equal('No backups. Capture one with heroku pg:backups:capture')
    })
  })

  context('with specifying a backup', function () {
    beforeEach(function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/apps/myapp/transfers/3?verbose=true')
        .reply(200, {
          from_name: 'RED', logs: [{created_at: '100', message: 'foo'}], num: 3, processed_bytes: 100_000, source_bytes: 1_000_000,
        })
    })

    it('shows the backup', async function () {
      const {stdout} = await cmdRun(['--app', 'myapp', 'b003'])
      expectOutput(stdout, heredoc(`
        === Backup b003
        Database:         ⛁ RED
        Status:           Pending
        Type:             Manual
        Original DB Size: 976.56KB
        Backup Size:      97.66KB
        
        === Backup Logs
        100 foo

      `))
    })
  })

  context('with specifying a legacy backup', function () {
    beforeEach(function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {
            from_type: 'pg_dump', name: 'ob001', num: 1, options: {pgbackups_name: 'b001'}, to_type: 'gof3r',
          },
        ])
        .get('/client/v11/apps/myapp/transfers/1?verbose=true')
        .reply(200, {
          from_name: 'RED', logs: [{created_at: '100', message: 'foo'}], name: 'ob001', num: 1, options: {pgbackups_name: 'b001'}, processed_bytes: 100_000, source_bytes: 1_000_000,
        })
    })

    it('shows the backup', async function () {
      const {stdout} = await cmdRun(['--app', 'myapp', 'ob001'])
      expectOutput(stdout, heredoc(`
        === Backup ob001
        Database:         ⛁ RED
        Status:           Pending
        Type:             Manual
        Original DB Size: 976.56KB
        Backup Size:      97.66KB

        === Backup Logs
        100 foo

      `))
    })
  })

  context('without specifying a backup', function () {
    beforeEach(function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {from_type: 'pg_dump', num: 3, to_type: 'gof3r'},
        ])
        .get('/client/v11/apps/myapp/transfers/3?verbose=true')
        .reply(200, {
          finished_at: '100', from_name: 'RED', logs: [{created_at: '100', message: 'foo'}], num: 3, processed_bytes: 100_000, source_bytes: 1_000_000, succeeded: true,
        })
    })

    it('shows the latest backup', async function () {
      const {stdout} = await cmdRun(['--app', 'myapp'])
      expectOutput(stdout, heredoc(`
        === Backup b003
        Database:         ⛁ RED
        Finished at:      100
        Status:           Completed
        Type:             Manual
        Original DB Size: 976.56KB
        Backup Size:      97.66KB (90% compression)

        === Backup Logs
        100 foo

      `))
    })
  })
}

describe('pg:backups:info', function () {
  shouldInfo((args: string[]) => runCommand(Cmd, args))
})
