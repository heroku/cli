import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import childProcess from 'node:child_process'
import {
  match, restore, SinonStub, stub,
} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/pull.js'

const heredoc = tsheredoc.default

describe('pg:pull', function () {
  const skipOnWindows = process.platform === 'win32' ? it.skip : it
  const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', 'mydb']
  const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-d', 'localdb']
  let db: pg.ConnectionDetails
  let createDbStub: SinonStub
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
    stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('00')
    stub(utils.pg.psql, 'sshTunnel').resolves()

    stub(Math, 'random').callsFake(() => 0)
    createDbStub = stub(childProcess, 'execSync')
    spawnStub = stub(childProcess, 'spawn')

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
  })

  afterEach(function () {
    restore()
    process.env = env
  })

  skipOnWindows('pulls a db in', async () => {
    const {stderr, stdout} = await runCommand(Cmd, [
      'postgres-1',
      'localdb',
      '-a',
      'myapp',
    ])

    expect(createDbStub.called).to.eq(true)
    expect(createDbStub.calledWithExactly('createdb localdb', {stdio: 'inherit'})).to.eq(true)
    expect(spawnStub.callCount).to.eq(2)
    expect(stdout).to.eq(heredoc`
      Pulling postgres-1 to localdb
      Pulling complete.
    `)
    expect(stderr).to.eq('')
  })

  skipOnWindows('opens an SSH tunnel and runs pg_dump for bastion databases', async () => {
    db.bastionHost = 'bastion-host'
    db.bastionKey = 'super-private-key'

    const {stderr, stdout} = await runCommand(Cmd, [
      'postgres-1',
      'localdb',
      '-a',
      'myapp',
    ])

    expect(createDbStub.called).to.eq(true)
    expect(createDbStub.calledWithExactly('createdb localdb', {stdio: 'inherit'})).to.eq(true)
    expect(spawnStub.callCount).to.eq(2)
    expect(stdout).to.eq(heredoc`
      Pulling postgres-1 to localdb
      Pulling complete.
    `)
    expect(stderr).to.eq('')
  })
})
