import {stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import * as proxyquire from 'proxyquire'
import heredoc from 'tsheredoc'

describe('pg:credentials', function () {
  const addon = {
    id: 1,
    name: 'postgres-1',
    plan: {name: 'heroku-postgresql:standard-0'},
  }
  const fetcher = {
    getAddon: () => addon,
  }

  const {default: Cmd} = proxyquire('../../../../src/commands/pg/credentials', {
    '../../lib/pg/fetcher': fetcher,
  })

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

    api.get('/addons/1/addon-attachments')
      .reply(200, attachments)
    pg.get('/postgres/v0/databases/1/credentials')
      .reply(200, credentials)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(heredoc(stdout.output)).to.eq(heredoc`
      Credential                                                                    State    
      ───────────────────────────────────────────────────────────────────────────── ──────── 
      default                                                                       active   
       └─ as DATABASE on main-app app                                                        
      jeff                                                                          rotating 
       ├─ as HEROKU_POSTGRESQL_GREEN on main-app app                                         
       └─ as HEROKU_POSTGRESQL_PINK on another-app app                                       
             Usernames currently active for this credential:                                 
              jeff          waiting for no connections to be revoked 0 connections           
              jeff-rotating active                                   2 connections           
      ransom                                                                        active   
       └─ as HEROKU_POSTGRESQL_BLUE on yet-another-app app                                   
    `)
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

    api.get('/addons/1/addon-attachments')
      .reply(200, attachments)
    pg.get('/postgres/v0/databases/1/credentials')
      .reply(200, credentials)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(heredoc(stdout.output)).to.eq(heredoc`
      Credential                                           State    
      ──────────────────────────────────────────────────── ──────── 
      default                                              active   
       └─ as DATABASE on main-app app                               
      jeff                                                 rotating 
       ├─ as HEROKU_POSTGRESQL_GREEN on main-app app                
       └─ as HEROKU_POSTGRESQL_PINK on another-app app              
      ransom                                               active   
       └─ as HEROKU_POSTGRESQL_BLUE on yet-another-app app          
    `)
  })
})
