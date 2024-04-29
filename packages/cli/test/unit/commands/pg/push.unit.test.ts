import {stderr, stdout} from 'stdout-stderr'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import heredoc from 'tsheredoc'
import {ConnectionDetailsWithAttachment} from '../../../../src/lib/pg/util'
import sinon = require('sinon')
import * as psql from '../../../../src/lib/pg/psql'
import * as childProcess from 'node:child_process'

describe('pg:push', () => {
  const skipOnWindows = process.platform === 'win32' ? it.skip : it
  const env = process.env
  const emptyResponse = '00'
  let db: Pick<ConnectionDetailsWithAttachment, 'user' | 'password' | 'database' | 'port' | 'host' | 'bastionHost' | 'bastionKey'> & {
    attachment: {
      addon: {name: string},
      config_vars: string[],
      app: {name: string},
    }
  }
  const fetcher = {
    database: () => db,
  }
  let tunnelStub: sinon.SinonStub
  let bastion: unknown
  let push_pull: unknown
  let Cmd: GenericCmd
  let spawnStub: sinon.SinonStub
  let psqlStub: sinon.SinonStub
  let mathRandomStub: sinon.SinonStub

  const exitHandler = (_key: string, func: CallableFunction) => {
    func(0)
  }

  beforeEach(() => {
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
    }
    tunnelStub = sinon.stub().callsArg(1)
    bastion = proxyquire('../../../../src/lib/pg/bastion', {
      'tunnel-ssh': tunnelStub,
    })
    push_pull = proxyquire('../../../../src/lib/pg/push_pull', {
      './bastion': bastion,
    });
    ({default: Cmd} = proxyquire('../../../../src/commands/pg/push', {
      '../../lib/pg/fetcher': fetcher,
      '../../lib/pg/push_pull': push_pull,
    }))
    mathRandomStub = sinon.stub(Math, 'random').callsFake(() => 0)
    psqlStub = sinon.stub(psql, 'exec').returns(Promise.resolve(emptyResponse))
    spawnStub = sinon.stub(childProcess, 'spawn')
  })

  afterEach(() => {
    tunnelStub.reset()
    mathRandomStub.restore()
    psqlStub.restore()
    spawnStub.restore()
    delete env.PGPORT
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
    env.PGPORT = '5433'

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

    const tunnelConf = {
      username: 'bastion',
      host: 'bastion-host',
      privateKey: 'super-private-key',
      dstHost: 'herokai.com',
      dstPort: 5432,
      localHost: '127.0.0.1',
      localPort: 49152,
    }

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
    expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.eq(true)
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
