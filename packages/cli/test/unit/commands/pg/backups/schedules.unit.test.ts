import {stderr, stdout} from 'stdout-stderr'
// import Cmd from '../../../../../src/commands/pg/backups/schedules'
import runCommand from '../../../../helpers/runCommand.js'
import nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput.js'
import {expect} from 'chai'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default
const shouldSchedules = function (cmdRun: (args: string[]) => Promise<any>) {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows empty message with no databases', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addons')
      .reply(200, [])
    await cmdRun(['--app', 'myapp'])
      .catch((error: Error) => {
        expect(error.message).to.equal('No heroku-postgresql databases on myapp')
      })
  })

  context('with databases', function () {
    beforeEach(function () {
      nock('https://api.heroku.com')
        .get('/apps/myapp/addons')
        .reply(200, [
          {
            id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'}, app: {name: 'myapp'},
          },
        ])
    })

    it('shows empty message with no schedules', async function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/databases/1/transfer-schedules')
        .reply(200, [])
      await cmdRun(['--app', 'myapp'])
      expect(stderr.output).to.include('Warning: No backup schedules found on ⬢ myapp')
      expect(stderr.output).to.include('Use heroku pg:backups:schedule to set one up')
    })

    it('shows schedule', async function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/databases/1/transfer-schedules')
        .reply(200, [
          {name: 'DATABASE_URL', hour: 5, timezone: 'UTC'},
        ])
      await cmdRun(['--app', 'myapp'])
      expectOutput(stdout.output, heredoc(`
        === Backup Schedules
        DATABASE_URL: daily at 5:00 UTC
      `))
    })
  })
}

/*
describe('pg:backups:schedules', function () {
  shouldSchedules((args: string[]) => runCommand(Cmd, args))
})

*/
