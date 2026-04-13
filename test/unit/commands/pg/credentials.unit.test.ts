import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/pg/credentials.js'
import runCommand from '../../../helpers/legacy-run-command.js'
import normalizeTableOutput from '../../../helpers/utils/normalize-table-output.js'

/** Strip app icon (⬢) so assertions pass whether or not the CLI outputs it. */
function stripAppIcon(s: string): string {
  return s.replaceAll('⬢', '')
}

describe('pg:credentials', function () {
  const addon = {
    id: 1,
    name: 'postgres-1',
    plan: {name: 'heroku-postgresql:standard-0'},
  }
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
    pg.done()
    api.done()
  })

  it('shows the correct credentials', async function () {
    const credentials = [
      {
        credentials: [],
        database: 'd123',
        host: 'localhost',
        name: 'ransom',
        port: 5442,
        state: 'active',
        uuid: 'aaaa',
      },
      {
        credentials: [],
        database: 'd123',
        host: 'localhost',
        name: 'default',
        port: 5442,
        state: 'active',
        uuid: 'aaab',
      },
      {
        credentials: [
          {
            connections: 0,
            state: 'revoking',
            user: 'jeff',
          },
          {
            connections: 2,
            state: 'active',
            user: 'jeff-rotating',
          },
        ],
        database: 'd123',
        host: 'localhost',
        name: 'jeff',
        port: 5442,
        state: 'rotating',
        uuid: 'aabb',
      },
    ]
    const attachments = [
      {
        app: {name: 'main-app'},
        name: 'DATABASE',
        namespace: null,
      },
      {
        app: {name: 'main-app'},
        name: 'HEROKU_POSTGRESQL_GREEN',
        namespace: 'credential:jeff',
      },
      {
        app: {name: 'another-app'},
        name: 'HEROKU_POSTGRESQL_PINK',
        namespace: 'credential:jeff',
      },
      {
        app: {name: 'yet-another-app'},
        name: 'HEROKU_POSTGRESQL_BLUE',
        namespace: 'credential:ransom',
      },
    ]

    api.post('/actions/addon-attachments/resolve', {addon_attachment: 'DATABASE_URL', app: 'myapp'})
      .reply(200, [{addon}])
      .get('/addons/1/addon-attachments')
      .reply(200, attachments)
    pg.get('/postgres/v0/databases/1/credentials')
      .reply(200, credentials)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const normalized = normalizeTableOutput(stripAppIcon(stdout.output))
    expect(normalized).to.include('connections state user')
    expect(normalized).to.include('0 connections waiting for no connections to be revoked jeff')
    expect(normalized).to.include('2 connections active jeff-rotating')
    expect(normalized).to.include('credential state')
    expect(normalized).to.include('default')
    expect(normalized).to.include('as database on main-app app')
    expect(normalized).to.include('active')
    expect(normalized).to.include('jeff')
    expect(normalized).to.include('as heroku_postgresql_green on main-app app')
    expect(normalized).to.include('rotating')
    expect(normalized).to.include('ransom')
    expect(normalized).to.include('heroku_postgresql_blue')
    expect(normalized).to.include('yet-another')
  })

  it('shows the correct rotation information if no connection information is available yet', async function () {
    const credentials = [
      {
        credentials: [],
        database: 'd123',
        host: 'localhost',
        name: 'ransom',
        port: 5442,
        state: 'active',
        uuid: 'aaaa',
      },
      {
        credentials: [],
        database: 'd123',
        host: 'localhost',
        name: 'default',
        port: 5442,
        state: 'active',
        uuid: 'aaab',
      },
      {
        credentials: [
          {
            state: 'active',
            user: 'jeff',
          },
          {
            state: 'enabling',
            user: 'jeff-rotating',
          },
        ],
        database: 'd123',
        host: 'localhost',
        name: 'jeff',
        port: 5442,
        state: 'rotating',
        uuid: 'aabb',
      },
    ]
    const attachments = [
      {
        app: {name: 'main-app'},
        name: 'DATABASE',
        namespace: null,
      },
      {
        app: {name: 'main-app'},
        name: 'HEROKU_POSTGRESQL_GREEN',
        namespace: 'credential:jeff',
      },
      {
        app: {name: 'another-app'},
        name: 'HEROKU_POSTGRESQL_PINK',
        namespace: 'credential:jeff',
      },
      {
        app: {name: 'yet-another-app'},
        name: 'HEROKU_POSTGRESQL_BLUE',
        namespace: 'credential:ransom',
      },
    ]

    api.post('/actions/addon-attachments/resolve', {addon_attachment: 'DATABASE_URL', app: 'myapp'})
      .reply(200, [{addon}])
      .get('/addons/1/addon-attachments')
      .reply(200, attachments)
    pg.get('/postgres/v0/databases/1/credentials')
      .reply(200, credentials)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const normalized = normalizeTableOutput(stripAppIcon(stdout.output))
    expect(normalized).to.include('credential state')
    expect(normalized).to.include('default')
    expect(normalized).to.include('└─ as database on main-app app')
    expect(normalized).to.include('active')
    expect(normalized).to.include('jeff')
    expect(normalized).to.include('├─ as heroku_postgresql_green on main-app app')
    expect(normalized).to.include('rotating')
    expect(normalized).to.include('ransom')
    expect(normalized).to.include('heroku_postgresql_blue')
    expect(normalized).to.include('yet-another')
  })

  it('passes no-wrap option through to table rendering', async function () {
    const credentials = [
      {
        credentials: [], database: 'd123', host: 'localhost', name: 'default', port: 5442, state: 'active', uuid: 'aaaa',
      },
    ]
    const attachments = [
      {app: {name: 'main-app'}, name: 'DATABASE', namespace: null},
    ]

    api.post('/actions/addon-attachments/resolve', {addon_attachment: 'DATABASE_URL', app: 'myapp'})
      .reply(200, [{addon}])
      .get('/addons/1/addon-attachments')
      .reply(200, attachments)
    pg.get('/postgres/v0/databases/1/credentials')
      .reply(200, credentials)

    const tableStub = sinon.stub(hux, 'table')
    await runCommand(Cmd, ['--app', 'myapp', '--no-wrap'])

    const callArgs = tableStub.firstCall.args
    expect(callArgs[2]).to.include({maxWidth: 'none', overflow: 'truncate'})
  })
})
