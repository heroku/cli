import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../../src/commands/pg/backups/schedule.js'
import runCommand from '../../../../helpers/runCommand.js'

type CLIError = {oclif?: {exit?: number}} & Error
describe('pg:backups:schedule', function () {
  let api: nock.Scope
  let dataApi: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    dataApi = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    api.done()
    dataApi.done()
    nock.cleanAll()
  })

  context('with correct arguments', function () {
    const continuousProtectionWarning = 'Logical backups of large databases are likely to fail.'

    beforeEach(function () {
      api
        .post('/actions/addon-attachments/resolve', {
          addon_attachment: 'DATABASE_URL',
          addon_service: 'heroku-postgresql',
          app: 'myapp',
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
      dataApi
        .post('/client/v11/databases/1/transfer-schedules', {
          hour: '06',
          schedule_name: 'DATABASE_URL',
          timezone: 'America/New_York',
        })
        .reply(201)
    })

    it('schedules a backup', async function () {
      const dbA = {
        info: [
          {name: 'Continuous Protection', values: ['On']},
        ],
      }
      dataApi
        .get('/client/v11/databases/1')
        .reply(200, dbA)

      await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(stdout.output).to.equal('')
      expect(stderr.output).to.include('Scheduling automatic daily backups of ⛁ postgres-1 at 06:00 America/New_York')
      expect(stderr.output).to.include('done')
    })

    it('warns user that logical backups are error prone if continuous protection is on', async function () {
      const dbA = {
        info: [
          {name: 'Continuous Protection', values: ['On']},
        ],
      }
      dataApi
        .get('/client/v11/databases/1')
        .reply(200, dbA)

      await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(ansis.strip(stderr.output)).to.include(continuousProtectionWarning)
    })

    it('does not warn user that logical backups are error prone if continuous protection is off', async function () {
      const dbA = {
        info: [
          {name: 'Continuous Protection', values: ['Off']},
        ],
      }
      dataApi
        .get('/client/v11/databases/1')
        .reply(200, dbA)

      await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(ansis.strip(stderr.output)).not.to.include(continuousProtectionWarning)
    })
  })

  it('errors when the scheduled time has an invalid hour value', async function () {
    try {
      await runCommand(Cmd, ['--at', '24:00', '--app', 'myapp'])
    } catch (error: unknown) {
      const err = error as CLIError
      expect(err.message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
      expect(err.oclif?.exit).to.equal(1)
    }
  })

  it('errors when the scheduled time has an invalid time zone value', async function () {
    try {
      await runCommand(Cmd, ['--at', '01:00 New York', '--app', 'myapp'])
    } catch (error: unknown) {
      const err = error as CLIError
      expect(err.message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
      expect(err.oclif?.exit).to.equal(1)
    }
  })

  it('errors when the scheduled time specifies minutes', async function () {
    try {
      await runCommand(Cmd, ['--at', '06:15 EDT', '--app', 'myapp'])
    } catch (error: unknown) {
      const err = error as CLIError
      expect(err.message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
      expect(err.oclif?.exit).to.equal(1)
    }
  })

  it('accepts a correctly formatted time string even if the time zone might not be correct', async function () {
    api
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE_URL',
        addon_service: 'heroku-postgresql',
        app: 'myapp',
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
    dataApi
      .get('/client/v11/databases/1')
      .reply(200, {info: []})
      .post('/client/v11/databases/1/transfer-schedules', {
        hour: '06',
        schedule_name: 'DATABASE_URL',
        timezone: 'New_York',
      })
      .reply(400, {id: 'bad_request', message: 'Bad request.'})

    try {
      await runCommand(Cmd, ['--at', '06:00 New_York', '--app', 'myapp'])
    } catch (error: unknown) {
      const err = error as CLIError
      expect(err.message).to.contain('Bad request.')
    }
  })
})
