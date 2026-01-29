import {stderr, stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/pg/push.js'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import tsheredoc from 'tsheredoc'
import {pg, utils} from '@heroku/heroku-cli-util'
import sinon = require('sinon')
import childProcess from 'node:child_process'

const heredoc = tsheredoc.default

describe('pg:push', function () {
  const skipOnWindows = process.platform === 'win32' ? it.skip : it
  let db: pg.ConnectionDetails
  const emptyResponse = '00'
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
      attachment: {
        addon: {
          name: 'postgres-1',
        },
        app: {name: 'myapp'},
        config_vars: ['DATABASE_URL'],
      },
      database: 'mydb',
      host: 'herokai.com',
      password: 'pass',
      port: '5432',
      user: 'jeff',
    } as pg.ConnectionDetails

    sinon.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
    sinon.stub(utils.pg.PsqlService.prototype, 'execQuery').resolves(emptyResponse)
    sinon.stub(utils.pg.psql, 'sshTunnel').resolves()

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
      on: exitHandler,
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, sinon.match.any).returns({
      on: exitHandler,
      stdin: {
        end() {},
      },
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
      on: exitHandler,
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, sinon.match.any).returns({
      on: exitHandler,
      stdin: {
        end() {},
      },
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
      on: exitHandler,
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, sinon.match.any).returns({
      on: exitHandler,
      stdin: {
        end() {},
      },
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
      on: exitHandler,
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, sinon.match.any).returns({
      on: exitHandler,
      stdin: {
        end() {},
      },
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
      on(key: string, func: CallableFunction) {
        return func(1)
      },
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, sinon.match.any).returns({
      stdin: {
        end() {},
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
