import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/info'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import heredoc from 'tsheredoc'
import stripAnsi = require('strip-ansi')

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
      await cmdRun(['--app', 'myapp'])
        .catch((error: Error) => {
          expect(stripAnsi(error.message)).to.equal('No backups. Capture one with heroku pg:backups:capture')
        })
    })
  })

  context('with specifying a backup', function () {
    beforeEach(function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/apps/myapp/transfers/3?verbose=true')
        .reply(200, {
          num: 3, source_bytes: 1000000, processed_bytes: 100000, from_name: 'RED', logs: [{created_at: '100', message: 'foo'}],
        })
    })

    it('shows the backup', async function () {
      await cmdRun(['--app', 'myapp', 'b003'])
      expectOutput(stdout.output, heredoc(`
        === Backup b003
        Database:         RED
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
          {name: 'ob001', num: 1, from_type: 'pg_dump', to_type: 'gof3r', options: {pgbackups_name: 'b001'}},
        ])
        .get('/client/v11/apps/myapp/transfers/1?verbose=true')
        .reply(200, {
          name: 'ob001', options: {pgbackups_name: 'b001'}, num: 1, source_bytes: 1000000, processed_bytes: 100000, from_name: 'RED', logs: [{created_at: '100', message: 'foo'}],
        })
    })

    it('shows the backup', async function () {
      await cmdRun(['--app', 'myapp', 'ob001'])
      expectOutput(stdout.output, heredoc(`
        === Backup ob001
        Database:         RED
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
          {num: 3, from_type: 'pg_dump', to_type: 'gof3r'},
        ])
        .get('/client/v11/apps/myapp/transfers/3?verbose=true')
        .reply(200, {
          num: 3, source_bytes: 1000000, processed_bytes: 100000, from_name: 'RED', finished_at: '100', succeeded: true, logs: [{created_at: '100', message: 'foo'}],
        })
    })

    it('shows the latest backup', async function () {
      await cmdRun(['--app', 'myapp'])
      expectOutput(stdout.output, heredoc(`
        === Backup b003
        Database:         RED
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
