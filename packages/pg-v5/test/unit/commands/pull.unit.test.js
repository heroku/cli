'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const {expect} = require('chai')

const skipOnWindows = process.platform === 'win32' ? it.skip : it

const env = process.env
let db

const fetcher = () => ({
  database: () => db,
})

let tunnelStub
let bastion
let push
let pull
let emptyResponse

let exitHandler = (key, func) => {
  func(0)
}

describe('pg', () => {
  beforeEach(() => {
    cli.mockConsole()
    cli.exit.mock()

    db = {
      user: 'jeff',
      password: 'pass',
      database: 'mydb',
      port: 5432,
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

    bastion = proxyquire('../../../lib/bastion', {
      'tunnel-ssh': tunnelStub,
    })

    push = proxyquire('../../../commands/pull', {
      '../lib/fetcher': fetcher,
      '../lib/bastion': bastion,
    })[0]

    pull = proxyquire('../../../commands/pull', {
      '../lib/fetcher': fetcher,
      '../lib/bastion': bastion,
    })[1]

    sinon.stub(Math, 'random').callsFake(() => 0)
    emptyResponse = '00'
  })

  afterEach(() => {
    tunnelStub.reset()
    Math.random.restore()
  })

  describe('push', () => {
    const dumpOpts = {
      env: {
        PGSSLMODE: 'prefer',
        ...env,
      },
      stdio: ['pipe', 'pipe', 2],
      encoding: 'utf8',
      shell: true,
    }
    const restoreOpts = {
      env: {
        PGPASSWORD: 'pass',
        ...env,
      },
      stdio: ['pipe', 'pipe', 2],
      encoding: 'utf8',
      shell: true,
    }

    const psql = require('../../../lib/psql')
    const childProcess = require('child_process')

    let spawnStub

    beforeEach(() => {
      sinon.stub(psql, 'exec').returns(Promise.resolve(emptyResponse))
      spawnStub = sinon.stub(childProcess, 'spawn')
    })

    afterEach(() => {
      psql.exec.restore()
      spawnStub.restore()
      delete env.PGPORT
      delete restoreOpts.env.PGPORT
      delete dumpOpts.env.PGPORT
    })

    skipOnWindows('pushes out a db', () => {
      const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', 'localdb']
      const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

      spawnStub.withArgs('pg_dump', dumpFlags, dumpOpts).returns({
        stdout: {
          pipe: () => {},
        },
        on: exitHandler,
      })
      spawnStub.withArgs('pg_restore', restoreFlags, restoreOpts).returns({
        stdin: {
          end: () => {},
        },
        on: exitHandler,
      })

      return push.run({args: {source: 'localdb', target: 'postgres-1'}, flags: {}})
        .then(() => expect(spawnStub.callCount).to.equal(2))
        .then(() => expect(cli.stdout).to.equal('heroku-cli: Pushing localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
        .then(() => expect(cli.stderr).to.equal(''))
    })

    skipOnWindows('pushes out a db using url port', () => {
      const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-h', 'localhost', '-p', '5433', 'localdb']
      const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

      spawnStub.withArgs('pg_dump', dumpFlags, dumpOpts).returns({
        stdout: {
          pipe: () => {},
        },
        on: exitHandler,
      })
      spawnStub.withArgs('pg_restore', restoreFlags, restoreOpts).returns({
        stdin: {
          end: () => {},
        },
        on: exitHandler,
      })

      return push.run({args: {source: 'postgres://localhost:5433/localdb', target: 'postgres-1'}, flags: {}})
        .then(() => expect(spawnStub.callCount).to.equal(2))
        .then(() => expect(cli.stdout).to.equal('heroku-cli: Pushing postgres://localhost:5433/localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
        .then(() => expect(cli.stderr).to.equal(''))
    })

    skipOnWindows('pushes out a db using PGPORT', () => {
      // eslint-disable-next-line no-multi-assign
      env.PGPORT = dumpOpts.env.PGPORT = '5433'
      restoreOpts.env.PGPORT = '5433'

      const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-p', '5433', 'localdb']
      const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

      spawnStub.withArgs('pg_dump', dumpFlags, dumpOpts).returns({
        stdout: {
          pipe: () => {},
        },
        on: exitHandler,
      })
      spawnStub.withArgs('pg_restore', restoreFlags, restoreOpts).returns({
        stdin: {
          end: () => {},
        },
        on: exitHandler,
      })

      return push.run({args: {source: 'localdb', target: 'postgres-1'}, flags: {}})
        .then(() => expect(spawnStub.callCount).to.equal(2))
        .then(() => expect(cli.stdout).to.equal('heroku-cli: Pushing localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
        .then(() => expect(cli.stderr).to.equal(''))
    })

    skipOnWindows('opens an SSH tunnel and runs pg_dump for bastion databases', () => {
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

      spawnStub.withArgs('pg_dump', dumpFlags, dumpOpts).returns({
        stdout: {
          pipe: () => {},
        },
        on: exitHandler,
      })
      spawnStub.withArgs('pg_restore', restoreFlags, restoreOpts).returns({
        stdin: {
          end: () => {},
        },
        on: exitHandler,
      })

      return push.run({args: {source: 'localdb', target: 'postgres-1'}, flags: {}})
        .then(() => expect(spawnStub.callCount).to.equal(2))
        .then(() => expect(cli.stdout).to.equal('heroku-cli: Pushing localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
        .then(() => expect(cli.stderr).to.equal(''))
        .then(() => expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true))
    })

    skipOnWindows('exits non-zero when there is an error', () => {
      const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', 'localdb']
      const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', '-d', 'mydb']

      spawnStub.withArgs('pg_dump', dumpFlags, dumpOpts).returns({
        stdout: {
          pipe: () => {},
        },
        on: (key, func) => {
          func(1)
        },
      })
      spawnStub.withArgs('pg_restore', restoreFlags, restoreOpts).returns({
        stdin: {
          end: () => {},
        },
      })

      return push.run({args: {source: 'localdb', target: 'postgres-1'}, flags: {}})
        .catch(error => {
          expect(error.message).to.equal('pg_dump errored with 1')
          expect(spawnStub.callCount).to.equal(2)
          expect(cli.stdout).to.equal('heroku-cli: Pushing localdb ---> postgres-1\n')
          expect(cli.stderr).to.equal('')
        })
    })
  })

  describe('pull', () => {
    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', '-U', 'jeff', '-h', 'herokai.com', '-p', '5432', 'mydb']
    const dumpOpts = {
      env: {
        PGPASSWORD: 'pass',
        PGSSLMODE: 'prefer',
        ...env,
      },
      stdio: ['pipe', 'pipe', 2],
      encoding: 'utf8',
      shell: true,
    }
    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', '-d', 'localdb']
    const restoreOpts = {
      env: {...env},
      stdio: ['pipe', 'pipe', 2],
      encoding: 'utf8',
      shell: true,
    }

    const childProcess = require('child_process')
    const psql = require('../../../lib/psql')

    let createDbStub
    let spawnStub

    beforeEach(() => {
      createDbStub = sinon.stub(childProcess, 'execSync')
      spawnStub = sinon.stub(childProcess, 'spawn')
      sinon.stub(psql, 'exec')

      spawnStub.withArgs('pg_dump', dumpFlags, dumpOpts).returns({
        stdout: {
          pipe: () => {},
        },
        on: exitHandler,
      })
      spawnStub.withArgs('pg_restore', restoreFlags, restoreOpts).returns({
        stdin: {
          end: () => {},
        },
        on: exitHandler,
      })
    })

    afterEach(() => {
      psql.exec.restore()
      createDbStub.restore()
      spawnStub.restore()
    })

    skipOnWindows('pulls a db in', () => {
      return pull.run({args: {source: 'postgres-1', target: 'localdb'}, flags: {}})
        .then(() => expect(createDbStub.calledOnce).to.equal(true))
        .then(() => expect(createDbStub.calledWithExactly('createdb localdb', {stdio: 'inherit'})).to.equal(true))
        .then(() => expect(spawnStub.callCount).to.equal(2))
        .then(() => expect(cli.stdout).to.equal('heroku-cli: Pulling postgres-1 ---> localdb\nheroku-cli: Pulling complete.\n'))
        .then(() => expect(cli.stderr).to.equal(''))
    })

    skipOnWindows('opens an SSH tunnel and runs pg_dump for bastion databases', () => {
      db.bastionHost = 'bastion-host'
      db.bastionKey = 'super-private-key'

      let tunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'herokai.com',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152,
      }

      return pull.run({args: {source: 'postgres-1', target: 'localdb'}, flags: {}})
        .then(() => expect(createDbStub.calledOnce).to.equal(true))
        .then(() => expect(createDbStub.calledWithExactly('createdb localdb', {stdio: 'inherit'})).to.equal(true))
        .then(() => expect(spawnStub.callCount).to.equal(2))
        .then(() => expect(cli.stdout).to.equal('heroku-cli: Pulling postgres-1 ---> localdb\nheroku-cli: Pulling complete.\n'))
        .then(() => expect(cli.stderr).to.equal(''))
        .then(() => expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true))
    })
  })
})
