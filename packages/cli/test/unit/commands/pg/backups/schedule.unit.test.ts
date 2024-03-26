import {stderr, stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/schedule'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')

const shouldSchedule = function (cmdRun: (args: string[]) => Promise<any>) {
  const continuousProtectionWarning = heredoc('Logical backups of large databases are likely to fail.')

  beforeEach(() => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'DATABASE_URL',
        addon_service: 'heroku-postgresql',
      })
      .reply(200, [
        {
          addon: {
            id: 1,
            name: 'postgres-1',
            plan: {name: 'heroku-postgresql:standard-0'},
          },
          config_vars: [
            'DATABASE_URL',
          ],
          name: 'DATABASE',
        },
      ])
    nock('https://api.data.heroku.com')
      .post('/client/v11/databases/1/transfer-schedules', {
        hour: '06',
        timezone: 'America/New_York',
        schedule_name: 'DATABASE_URL',
      })
      .reply(201)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('schedules a backup', async () => {
    const dbA = {info: [
      {name: 'Continuous Protection', values: ['On']},
    ]}
    nock('https://api.data.heroku.com')
      .get('/client/v11/databases/1')
      .reply(200, dbA)
    await cmdRun(['--at', '06:00 EDT', '--app', 'myapp'])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.include(heredoc(`
      Scheduling automatic daily backups of postgres-1 at 06:00 America/New_York...
      Scheduling automatic daily backups of postgres-1 at 06:00 America/New_York... done
    `))
  })

  it('warns user that logical backups are error prone if continuous protection is on', async () => {
    const dbA = {info: [
      {name: 'Continuous Protection', values: ['On']},
    ]}
    nock('https://api.data.heroku.com')
      .get('/client/v11/databases/1')
      .reply(200, dbA)
    await cmdRun(['--at', '06:00 EDT', '--app', 'myapp'])
    expect(stripAnsi(stderr.output)).to.include(continuousProtectionWarning)
  })

  it('does not warn user that logical backups are error prone if continuous protection is off', async () => {
    const dbA = {info: [
      {name: 'Continuous Protection', values: ['Off']},
    ]}
    nock('https://api.data.heroku.com')
      .get('/client/v11/databases/1')
      .reply(200, dbA)
    await cmdRun(['--at', '06:00 EDT', '--app', 'myapp'])
    expect(stripAnsi(stderr.output)).not.to.include(continuousProtectionWarning)
  })
}

describe('pg:backups:schedule', () => {
  shouldSchedule((args: string[]) => runCommand(Cmd, args))
})
