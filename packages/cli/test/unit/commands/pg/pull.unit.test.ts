/*
import {stderr, stdout} from 'stdout-stderr'
import runCommand, {GenericCmd} from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import heredoc from 'tsheredoc'
import {ConnectionDetailsWithAttachment, utils} from '@heroku/heroku-cli-util'
import sinon = require('sinon')
import * as childProcess from 'node:child_process'

describe('pg:pull', function () {
  const skipOnWindows = process.platform === 'win32' ? it.skip : it
  const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', 'mydb']
  const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-d', 'localdb']
  let db: ConnectionDetailsWithAttachment
  let push_pull: unknown
  let Cmd: GenericCmd
  let createDbStub: sinon.SinonStub
  let spawnStub: sinon.SinonStub
  let env: NodeJS.ProcessEnv
  let sshTunnelStub: sinon.SinonStub

  const exitHandler = (_key: string, func: CallableFunction) => {
    func(0)
  }

  beforeEach(function () {
    env = process.env
    process.env = {}
    db = {
      user: 'jeff',
      password: 'pass',
      database: 'mydb',
      port: '5432',
      host: 'herokai.com',
      attachment: {
        addon: {
          name: 'postgres-1',
        },
        config_vars: ['DATABASE_URL'],
        app: {name: 'myapp'},
      },
    } as ConnectionDetailsWithAttachment
    sshTunnelStub = sinon.stub().resolves()
    const mockUtils = {
      pg: {
        DatabaseResolver: class {
          getDatabase = sinon.stub().callsFake(() => db)
          static parsePostgresConnectionString(url: string) {
            return utils.pg.DatabaseResolver.parsePostgresConnectionString(url)
          }
        },
        PsqlService: class {
          execQuery = sinon.stub().resolves('')
        },
        psql: {
          getPsqlConfigs: sinon.stub().callsFake((db: ConnectionDetailsWithAttachment) => {
            return utils.pg.psql.getPsqlConfigs(db)
          }),
          sshTunnel: sshTunnelStub,
        },
      },
    }
    push_pull = proxyquire('../../../../src/lib/pg/push_pull', {
      '@heroku/heroku-cli-util': {
        utils: mockUtils,
      },
    })
    Cmd = proxyquire('../../../../src/commands/pg/pull', {
      '@heroku/heroku-cli-util': {
        utils: mockUtils,
      },
      '../../lib/pg/push_pull': push_pull,
    }).default
    sinon.stub(Math, 'random').callsFake(() => 0)
    createDbStub = sinon.stub(childProcess, 'execSync')
    spawnStub = sinon.stub(childProcess, 'spawn')

    spawnStub.withArgs('pg_dump', dumpFlags, sinon.match.any).returns({
      stdout: {
        pipe: () => {},
      },
      on: exitHandler,
    })
    spawnStub.withArgs('pg_restore', restoreFlags, sinon.match.any).returns({
      stdin: {
        end: () => {},
      },
      on: exitHandler,
    })
  })

  afterEach(function () {
    sinon.restore()
    process.env = env
  })

  skipOnWindows('pulls a db in', async () => {
    await runCommand(Cmd, [
      'postgres-1',
      'localdb',
      '-a',
      'myapp',
    ])

    expect(createDbStub.called).to.eq(true)
    expect(createDbStub.calledWithExactly('createdb localdb', {stdio: 'inherit'})).to.eq(true)
    expect(spawnStub.callCount).to.eq(2)
    expect(stdout.output).to.eq(heredoc`
      Pulling postgres-1 to localdb
      Pulling complete.
    `)
    expect(stderr.output).to.eq('')
  })

  skipOnWindows('opens an SSH tunnel and runs pg_dump for bastion databases', async () => {
    db.bastionHost = 'bastion-host'
    db.bastionKey = 'super-private-key'

    await runCommand(Cmd, [
      'postgres-1',
      'localdb',
      '-a',
      'myapp',
    ])

    expect(createDbStub.called).to.eq(true)
    expect(createDbStub.calledWithExactly('createdb localdb', {stdio: 'inherit'})).to.eq(true)
    expect(spawnStub.callCount).to.eq(2)
    expect(stdout.output).to.eq(heredoc`
      Pulling postgres-1 to localdb
      Pulling complete.
    `)
    expect(stderr.output).to.eq('')
  })
})

*/
