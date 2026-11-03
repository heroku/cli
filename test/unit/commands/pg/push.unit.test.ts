import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import childProcess from 'node:child_process'
import {
  match, restore, SinonStub, stub,
} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/push.js'

const heredoc = tsheredoc

describe('pg:push', function () {
  const skipOnWindows = process.platform === 'win32' ? it.skip : it
  let db: pg.ConnectionDetails
  const emptyResponse = '00'
  let spawnStub: SinonStub
  let env: NodeJS.ProcessEnv

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

    stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
    stub(utils.pg.PsqlService.prototype, 'execQuery').resolves(emptyResponse)
    stub(utils.pg.psql, 'sshTunnel').resolves()

    stub(Math, 'random').callsFake(() => 0)
    spawnStub = stub(childProcess, 'spawn')
  })

  afterEach(function () {
    restore()
    process.env = env
  })

  skipOnWindows('pushes out a db', async () => {
    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

    spawnStub.withArgs('pg_dump', dumpFlags, match.any).returns({
      on: exitHandler,
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, match.any).returns({
      on: exitHandler,
      stdin: {
        end() {},
      },
    })

    const {stderr, stdout} = await runCommand(Cmd, [
      'localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout).to.eq(heredoc`
      Pushing localdb to postgres-1
      Pushing complete.
    `)
    expect(stderr).to.eq('')
  })

  skipOnWindows('pushes out a db using url port', async () => {
    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-h', 'localhost', '-p', '5433', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

    spawnStub.withArgs('pg_dump', dumpFlags, match.any).returns({
      on: exitHandler,
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, match.any).returns({
      on: exitHandler,
      stdin: {
        end() {},
      },
    })

    const {stderr, stdout} = await runCommand(Cmd, [
      'postgres://localhost:5433/localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout).to.eq(heredoc`
      Pushing postgres://localhost:5433/localdb to postgres-1
      Pushing complete.
    `)
    expect(stderr).to.eq('')
  })

  skipOnWindows('pushes out a db using PGPORT', async () => {
    process.env.PGPORT = '5433'

    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-p', '5433', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

    spawnStub.withArgs('pg_dump', dumpFlags, match.any).returns({
      on: exitHandler,
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, match.any).returns({
      on: exitHandler,
      stdin: {
        end() {},
      },
    })

    const {stderr, stdout} = await runCommand(Cmd, [
      'localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout).to.eq(heredoc`
      Pushing localdb to postgres-1
      Pushing complete.
    `)
    expect(stderr).to.eq('')
  })

  skipOnWindows('opens an SSH tunnel and runs pg_dump for bastion databases', async () => {
    db.bastionHost = 'bastion-host'
    db.bastionKey = 'super-private-key'

    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

    spawnStub.withArgs('pg_dump', dumpFlags, match.any).returns({
      on: exitHandler,
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, match.any).returns({
      on: exitHandler,
      stdin: {
        end() {},
      },
    })

    const {stderr, stdout} = await runCommand(Cmd, [
      'localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout).to.eq(heredoc`
      Pushing localdb to postgres-1
      Pushing complete.
    `)
    expect(stderr).to.eq('')
  })

  describe('with --exclude-table-data', function () {
    beforeEach(function () {
      spawnStub.withArgs('pg_dump', match.array, match.any).returns({
        on: exitHandler,
        stdout: {
          pipe() {},
        },
      })
      spawnStub.withArgs('pg_restore', match.array, match.any).returns({
        on: exitHandler,
        stdin: {
          end() {},
        },
      })
    })

    const getSpawnArgs = (command: string): string[] => {
      const call = spawnStub.getCalls().find(call => call.args[0] === command)
      expect(call, `${command} should have been spawned`).to.not.eq(undefined)
      return call!.args[1] as string[]
    }

    it('passes the exclusion and keeps the database name as the last pg_dump argument', async () => {
      await runCommand(Cmd, [
        'localdb',
        'postgres-1',
        '-a',
        'myapp',
        '--exclude-table-data=logs',
      ])

      const dumpArgs = getSpawnArgs('pg_dump')
      expect(dumpArgs).to.include('--exclude-table-data=logs')
      expect(dumpArgs.at(-1)).to.eq('localdb')

      const restoreArgs = getSpawnArgs('pg_restore')
      expect(restoreArgs.at(-1)).to.eq('mydb')
    })

    it('keeps the database name last when excluding multiple tables', async () => {
      await runCommand(Cmd, [
        'localdb',
        'postgres-1',
        '-a',
        'myapp',
        '--exclude-table-data=logs;events',
      ])

      const dumpArgs = getSpawnArgs('pg_dump')
      expect(dumpArgs.some(arg => arg.includes('--exclude-table-data=logs'))).to.eq(true)
      expect(dumpArgs.some(arg => arg.includes('--exclude-table-data=events'))).to.eq(true)
      expect(dumpArgs.at(-1)).to.eq('localdb')

      const restoreArgs = getSpawnArgs('pg_restore')
      expect(restoreArgs.at(-1)).to.eq('mydb')
    })
  })

  skipOnWindows('exits non-zero when there is an error', async () => {
    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', 'localdb']
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

    spawnStub.withArgs('pg_dump', dumpFlags, match.any).returns({
      on(key: string, func: CallableFunction) {
        return func(1)
      },
      stdout: {
        pipe() {},
      },
    })
    spawnStub.withArgs('pg_restore', restoreFlags, match.any).returns({
      stdin: {
        end() {},
      },
    })

    const {error, stderr, stdout} = await runCommand(Cmd, [
      'localdb',
      'postgres-1',
      '-a',
      'myapp',
    ])
    const {message} = error as Error
    expect(message).to.eq('pg_dump errored with 1')

    expect(spawnStub.callCount).to.eq(2)
    expect(stdout).to.eq('Pushing localdb to postgres-1\n')
    expect(stderr).to.eq('')
  })
})
