import {stderr, stdout} from 'stdout-stderr'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import heredoc from 'tsheredoc'
import {ConnectionDetailsWithAttachment} from '../../../../src/lib/pg/util'
import sinon = require('sinon')
import * as psql from '../../../../src/lib/pg/psql'
import * as childProcess from 'node:child_process'
import {TunnelConfig} from '../../../../src/lib/pg/bastion'

describe('pg:pull', () => {
  const skipOnWindows = process.platform === 'win32' ? it.skip : it
  const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', 'mydb']
  const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-d', 'localdb']
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
  let mathRandomStub: sinon.SinonStub
  let createDbStub: sinon.SinonStub
  let spawnStub: sinon.SinonStub
  let psqlStub: sinon.SinonStub

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
    ({default: Cmd} = proxyquire('../../../../src/commands/pg/pull', {
      '../../lib/pg/fetcher': fetcher,
      '../../lib/pg/push_pull': push_pull,
    }))
    mathRandomStub = sinon.stub(Math, 'random').callsFake(() => 0)
    createDbStub = sinon.stub(childProcess, 'execSync')
    spawnStub = sinon.stub(childProcess, 'spawn')
    psqlStub = sinon.stub(psql, 'exec')

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

  afterEach(() => {
    createDbStub.restore()
    tunnelStub.reset()
    mathRandomStub.restore()
    psqlStub.restore()
    spawnStub.restore()
  })

  skipOnWindows('pulls a db in', async () => {
    await runCommand(Cmd, [
      'postgres-1',
      'localdb',
      '-a',
      'myapp',
    ])

    expect(createDbStub.calledOnce).to.eq(true)
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

    const tunnelConf: TunnelConfig = {
      username: 'bastion',
      host: 'bastion-host',
      privateKey: 'super-private-key',
      dstHost: 'herokai.com',
      dstPort: 5432,
      localHost: '127.0.0.1',
      localPort: 49152,
    }

    await runCommand(Cmd, [
      'postgres-1',
      'localdb',
      '-a',
      'myapp',
    ])

    expect(createDbStub.calledOnce).to.eq(true)
    expect(createDbStub.calledWithExactly('createdb localdb', {stdio: 'inherit'})).to.eq(true)
    expect(spawnStub.callCount).to.eq(2)
    expect(stdout.output).to.eq(heredoc`
      Pulling postgres-1 to localdb
      Pulling complete.
    `)
    expect(stderr.output).to.eq('')
    expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.eq(true)
  })
})
