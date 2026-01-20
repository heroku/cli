import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/capture.js'
import runCommand from '../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('pg:backups:capture', function () {
  const addon = {
    app: {name: 'myapp'}, id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
  }
  let api: nock.Scope
  let pgApi: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    pgApi = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    nock.cleanAll()
    api.done()
    pgApi.done()
  })

  it('captures a db', async function () {
    const dbA = {
      info: [
        {name: 'Continuous Protection', values: ['On']},
      ],
    }
    api
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql', app: 'myapp',
      })
      .reply(200, [{addon}])
    pgApi
      .post('/client/v11/databases/1/backups')
      .reply(200, {
        from_name: 'DATABASE', num: 5, uuid: '100-001',
      })
      .get('/client/v11/apps/myapp/transfers/100-001')
      .reply(200, {
        finished_at: '101', succeeded: true,
      })
      .get('/client/v11/databases/1')
      .reply(200, dbA)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

    `)
    expect(stderr.output).to.match(new RegExp(heredoc`
      Starting backup of ⛁ postgres-1... done
      Backing up ⛁ DATABASE to b005... done
    `))
    expect(stderr.output).to.match(/backups of large databases are likely to fail/)
  })

  it('captures a db (verbose)', async function () {
    const dbA = {
      info: [
        {name: 'Continuous Protection', values: ['Off']},
      ],
    }
    api
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql', app: 'myapp',
      })
      .reply(200, [{addon}])
    pgApi
      .post('/client/v11/databases/1/backups')
      .reply(200, {
        from_name: 'DATABASE', num: 5, uuid: '100-001',
      })
      .get('/client/v11/apps/myapp/transfers/100-001?verbose=true')
      .reply(200, {
        finished_at: '101', logs: [{created_at: '100', message: 'log message 1'}], succeeded: true,
      })
      .get('/client/v11/databases/1')
      .reply(200, dbA)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--verbose',
    ])

    api.done()
    pgApi.done()

    expect(stdout.output).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

      Backing up ⛁ DATABASE to b005...
      100 log message 1
    `)
    expect(stderr.output).to.match(/Starting backup of ⛁ postgres-1... done/)
    expect(stderr.output).not.to.match(/backups of large databases are likely to fail/)
  })

  it('captures a db (verbose) with non billing app', async function () {
    addon.app.name = 'mybillingapp'
    const dbA = {
      info: [
        {name: 'Continuous Protection', values: ['On']},
      ],
    }
    api
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql', app: 'myapp',
      })
      .reply(200, [{addon}])
    pgApi
      .post('/client/v11/databases/1/backups')
      .reply(200, {
        from_name: 'DATABASE', num: 5, uuid: '100-001',
      })
      .get('/client/v11/apps/mybillingapp/transfers/100-001?verbose=true')
      .reply(200, {
        finished_at: '101', logs: [{created_at: '100', message: 'log message 1'}], succeeded: true,
      })
      .get('/client/v11/databases/1')
      .reply(200, dbA)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--verbose',
    ])

    api.done()
    pgApi.done()

    expect(stdout.output).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

      HINT: You are running this command with a non-billing application.
      Use heroku pg:backups -a mybillingapp to check the list of backups.

      Backing up ⛁ DATABASE to b005...
      100 log message 1
    `)
    expect(stderr.output).to.match(/Starting backup of ⛁ postgres-1... done/)
    expect(stderr.output).to.match(/backups of large databases are likely to fail/)
  })
})
