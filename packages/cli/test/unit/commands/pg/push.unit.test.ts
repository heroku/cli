/*
import {stderr, stdout} from 'stdout-stderr'
import runCommand, {GenericCmd} from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import heredoc from 'tsheredoc'
import {ConnectionDetailsWithAttachment, utils} from '@heroku/heroku-cli-util'
import sinon = require('sinon')
import * as childProcess from 'node:child_process'

describe('pg:push', function () {
  const skipOnWindows = process.platform === 'win32' ? it.skip : it
  let db: ConnectionDetailsWithAttachment
  let push_pull: unknown
  const emptyResponse = '00'
  let Cmd: GenericCmd
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
          execQuery = sinon.stub().resolves(emptyResponse)
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
    Cmd = proxyquire('../../../../src/commands/pg/push', {
      '@heroku/heroku-cli-util': {
        utils: mockUtils,
      },
      '../../lib/pg/push_pull': push_pull,
    }).default
    sinon.stub(Math, 'random').callsFake(() => 0)
    spawnStub = sinon.stub(childProcess, 'spawn')
  })

  afterEach(function () {
    sinon.restore()
    process.env = env
  })

  skipOnWindows('pushes out a db', async () => {
    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

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

    await runCommand(Cmd, [
      'localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout.output).to.eq(heredoc`
      Pushing localdb to postgres-1
      Pushing complete.
    `)
    expect(stderr.output).to.eq('')
  })

  skipOnWindows('pushes out a db using url port', async () => {
    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-h', 'localhost', '-p', '5433', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

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

    await runCommand(Cmd, [
      'postgres://localhost:5433/localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout.output).to.eq(heredoc`
      Pushing postgres://localhost:5433/localdb to postgres-1
      Pushing complete.
    `)
    expect(stderr.output).to.eq('')
  })

  skipOnWindows('pushes out a db using PGPORT', async () => {
    process.env.PGPORT = '5433'

    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-p', '5433', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

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

    await runCommand(Cmd, [
      'localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout.output).to.eq(heredoc`
      Pushing localdb to postgres-1
      Pushing complete.
    `)
    expect(stderr.output).to.eq('')
  })

  skipOnWindows('opens an SSH tunnel and runs pg_dump for bastion databases', async () => {
    db.bastionHost = 'bastion-host'
    db.bastionKey = 'super-private-key'

    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

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

    await runCommand(Cmd, [
      'localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout.output).to.eq(heredoc`
      Pushing localdb to postgres-1
      Pushing complete.
    `)
    expect(stderr.output).to.eq('')
  })

  skipOnWindows('exits non-zero when there is an error', async () => {
    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

    spawnStub.withArgs('pg_dump', dumpFlags, sinon.match.any).returns({
      stdout: {
        pipe: () => {},
      },
      on: (key: string, func: CallableFunction) => {
        func(1)
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, sinon.match.any).returns({
      stdin: {
        end: () => {},
      },
    })

    try {
      await runCommand(Cmd, [
        'localdb',
        'postgres-1',
        '-a',
        'myapp',
      ])
    } catch (error) {
      const {message} = error as Error
      expect(message).to.eq('pg_dump errored with 1')
    }

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout.output).to.eq('Pushing localdb to postgres-1\n')
    expect(stderr.output).to.eq('')
  })
})

*/
