import {stderr, stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/schedule'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')
import {CLIError} from '@oclif/core/lib/errors'
import {HTTPError} from 'http-call'

describe('pg:backups:schedule', function () {
  let api: nock.Scope
  let data: nock.Scope

  context('with correct arguments', function () {
    const continuousProtectionWarning = 'Logical backups of large databases are likely to fail.'

    beforeEach(function () {
      api = nock('https://api.heroku.com')
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
      data = nock('https://api.data.heroku.com')
        .post('/client/v11/databases/1/transfer-schedules', {
          hour: '06',
          timezone: 'America/New_York',
          schedule_name: 'DATABASE_URL',
        })
        .reply(201)
    })

    afterEach(function () {
      nock.cleanAll()
      api.done()
      data.done()
    })

    it('schedules a backup', async function () {
      const dbA = {info: [
        {name: 'Continuous Protection', values: ['On']},
      ]}
      nock('https://api.data.heroku.com')
        .get('/client/v11/databases/1')
        .reply(200, dbA)

      await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(stdout.output).to.equal('')
      expect(stderr.output).to.include(heredoc(`
        Scheduling automatic daily backups of postgres-1 at 06:00 America/New_York...
        Scheduling automatic daily backups of postgres-1 at 06:00 America/New_York... done
      `))
    })

    it('warns user that logical backups are error prone if continuous protection is on', async function () {
      const dbA = {info: [
        {name: 'Continuous Protection', values: ['On']},
      ]}
      nock('https://api.data.heroku.com')
        .get('/client/v11/databases/1')
        .reply(200, dbA)

      await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(stripAnsi(stderr.output)).to.include(continuousProtectionWarning)
    })

    it('does not warn user that logical backups are error prone if continuous protection is off', async function () {
      const dbA = {info: [
        {name: 'Continuous Protection', values: ['Off']},
      ]}
      nock('https://api.data.heroku.com')
        .get('/client/v11/databases/1')
        .reply(200, dbA)

      await runCommand(Cmd, ['--at', '06:00 EDT', '--app', 'myapp'])

      expect(stripAnsi(stderr.output)).not.to.include(continuousProtectionWarning)
    })
  })

  it('errors when the scheduled time has an invalid hour value', async function () {
    try {
      await runCommand(Cmd, ['--at', '24:00', '--app', 'myapp'])
    } catch (error: unknown) {
      const {message, oclif} = error as CLIError
      expect(message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
      expect(oclif.exit).to.equal(1)
    }
  })

  it('errors when the scheduled time has an invalid time zone value', async function () {
    try {
      await runCommand(Cmd, ['--at', '01:00 New York', '--app', 'myapp'])
    } catch (error: unknown) {
      const {message, oclif} = error as CLIError
      expect(message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
      expect(oclif.exit).to.equal(1)
    }
  })

  it('errors when the scheduled time specifies minutes', async function () {
    try {
      await runCommand(Cmd, ['--at', '06:15 EDT', '--app', 'myapp'])
    } catch (error: unknown) {
      const {message, oclif} = error as CLIError
      expect(message).to.eq("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
      expect(oclif.exit).to.equal(1)
    }
  })

  it('accepts a correctly formatted time string even if the time zone might not be correct', async function () {
    api = nock('https://api.heroku.com')
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
    data = nock('https://api.data.heroku.com')
      .get('/client/v11/databases/1')
      .reply(200, {info: []})
      .post('/client/v11/databases/1/transfer-schedules', {
        hour: '06',
        timezone: 'New_York',
        schedule_name: 'DATABASE_URL',
      })
      .reply(400, {id: 'bad_request', message: 'Bad request.'})

    try {
      await runCommand(Cmd, ['--at', '06:00 New_York', '--app', 'myapp'])
    } catch (error: unknown) {
      const {message} = error as CLIError
      expect(message).to.contain('Bad request.')
    }

    api.done()
    data.done()
    nock.cleanAll()
  })
})
