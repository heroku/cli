import {stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import nock from 'nock'
import Cmd from '../../../../src/commands/pg/credentials.js'
import tsheredoc from 'tsheredoc'
import normalizeTableOutput from '../../../helpers/utils/normalizeTableOutput.js'

const heredoc = tsheredoc.default

/** Strip app icon (⬢) so assertions pass whether or not the CLI outputs it. */
function stripAppIcon(s: string): string {
  return s.replace(/\u2B22/g, '')
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
    pg.done()
    api.done()
  })

  it('shows the correct credentials', async function () {
    const credentials = [
      {uuid: 'aaaa',
        name: 'ransom',
        state: 'active',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: []},
      {uuid: 'aaab',
        name: 'default',
        state: 'active',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: []},
      {uuid: 'aabb',
        name: 'jeff',
        state: 'rotating',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: [
          {
            user: 'jeff',
            connections: 0,
            state: 'revoking',
          },
          {
            user: 'jeff-rotating',
            connections: 2,
            state: 'active',
          },
        ]},
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

    api.post('/actions/addon-attachments/resolve', {addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql', app: 'myapp'})
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
      {uuid: 'aaaa',
        name: 'ransom',
        state: 'active',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: []},
      {uuid: 'aaab',
        name: 'default',
        state: 'active',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: []},
      {uuid: 'aabb',
        name: 'jeff',
        state: 'rotating',
        database: 'd123',
        host: 'localhost',
        port: 5442,
        credentials: [
          {
            user: 'jeff',
            state: 'active',
          },
          {
            user: 'jeff-rotating',
            state: 'enabling',
          },
        ]},
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

    api.post('/actions/addon-attachments/resolve', {addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql', app: 'myapp'})
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
})
