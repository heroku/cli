import type {pg} from '@heroku/heroku-cli-util'
import * as pgUtils from '@heroku/heroku-cli-util/utils/pg'
import {expect} from 'chai'
import childProcess from 'node:child_process'
import sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/pull.js'
import * as pushPull from '../../../../src/lib/pg/push_pull.js'
import {runCommand} from '../../../helpers/run-command.js'

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

    sinon.stub(pgUtils.DatabaseResolver.prototype, 'getDatabase').resolves(db)
    sinon.stub(pgUtils.PsqlService.prototype, 'execQuery').resolves('00')
    sinon.stub(pushPull.psqlHelpers, 'sshTunnel').resolves()

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
