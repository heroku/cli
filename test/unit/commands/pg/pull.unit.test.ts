import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import childProcess from 'node:child_process'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/pull.js'
import runCommand from '../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('pg:pull', function () {
  const skipOnWindows = process.platform === 'win32' ? it.skip : it
  const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', 'mydb']
  const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-d', 'localdb']
  let db: pg.ConnectionDetails
  let createDbStub: sinon.SinonStub
  let spawnStub: sinon.SinonStub
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

    sinon.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
    sinon.stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('00')
    sinon.stub(utils.pg.psql, 'sshTunnel').resolves()

    sinon.stub(Math, 'random').callsFake(() => 0)
    createDbStub = sinon.stub(childProcess, 'execSync')
    spawnStub = sinon.stub(childProcess, 'spawn')

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
