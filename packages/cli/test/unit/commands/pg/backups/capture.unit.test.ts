import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/capture'
import runCommand from '../../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import heredoc from 'tsheredoc'

describe('pg:backups:capture', function () {
  const addon = {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'}, app: {name: 'myapp'}}

  afterEach(function () {
    nock.cleanAll()
  })

  it('captures a db', async function () {
    const dbA = {info: [
      {name: 'Continuous Protection', values: ['On']},
    ]}
    const api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql',
      })
      .reply(200, [{addon}])
    const pg = nock('https://api.data.heroku.com')
      .post('/client/v11/databases/1/backups')
      .reply(200, {
        num: 5, from_name: 'DATABASE', uuid: '100-001',
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

    api.done()
    pg.done()

    expect(stdout.output).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

    `)
    expect(stderr.output).to.match(new RegExp(heredoc`
      Starting backup of postgres-1...
      Starting backup of postgres-1... done
      Backing up DATABASE to b005...
      Backing up DATABASE to b005... done
    `))
    expect(stderr.output).to.match(/backups of large databases are likely to fail/)
  })

  it('captures a db (verbose)', async function () {
    const dbA = {info: [
      {name: 'Continuous Protection', values: ['Off']},
    ]}
    const api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql',
      })
      .reply(200, [{addon}])
    const pg = nock('https://api.data.heroku.com')
      .post('/client/v11/databases/1/backups')
      .reply(200, {
        num: 5, from_name: 'DATABASE', uuid: '100-001',
      })
      .get('/client/v11/apps/myapp/transfers/100-001?verbose=true')
      .reply(200, {
        finished_at: '101', succeeded: true, logs: [{created_at: '100', message: 'log message 1'}],
      })
      .get('/client/v11/databases/1')
      .reply(200, dbA)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--verbose',
    ])

    api.done()
    pg.done()

    expect(stdout.output).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

      Backing up DATABASE to b005...
      100 log message 1
    `)
    expect(stderr.output).to.match(/Starting backup of postgres-1... done/)
    expect(stderr.output).not.to.match(/backups of large databases are likely to fail/)
  })

  it('captures a db (verbose) with non billing app', async function () {
    addon.app.name = 'mybillingapp'
    const dbA = {info: [
      {name: 'Continuous Protection', values: ['On']},
    ]}
    const api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql',
      })
      .reply(200, [{addon}])
    const pg = nock('https://api.data.heroku.com')
      .post('/client/v11/databases/1/backups')
      .reply(200, {
        num: 5, from_name: 'DATABASE', uuid: '100-001',
      })
      .get('/client/v11/apps/mybillingapp/transfers/100-001?verbose=true')
      .reply(200, {
        finished_at: '101', succeeded: true, logs: [{created_at: '100', message: 'log message 1'}],
      })
      .get('/client/v11/databases/1')
      .reply(200, dbA)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--verbose',
    ])

    api.done()
    pg.done()

    expect(stdout.output).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

      HINT: You are running this command with a non-billing application.
      Use heroku pg:backups -a mybillingapp to check the list of backups.

      Backing up DATABASE to b005...
      100 log message 1
    `)
    expect(stderr.output).to.match(/Starting backup of postgres-1... done/)
    expect(stderr.output).to.match(/backups of large databases are likely to fail/)
  })
})
