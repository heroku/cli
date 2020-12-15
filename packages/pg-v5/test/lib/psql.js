'use strict'

/* global describe it beforeEach afterEach context */

const fs = require('fs')
const path = require('path')
const { PassThrough } = require('stream')
const { EventEmitter, once } = require('events')
const { constants: { signals } } = require('os')
const ChildProcess = require('child_process')

const proxyquire = require('proxyquire')
const tmp = require('tmp')
const sinon = require('sinon')
const { expect } = require('chai')

const unwrap = require('../unwrap')

const db = {
  user: 'jeff',
  password: 'pass',
  database: 'mydb',
  port: 5432,
  host: 'localhost',
  hostname: 'localhost'
}

const bastionDb = {
  user: 'jeff',
  password: 'pass',
  database: 'mydb',
  port: 5432,
  bastionHost: 'bastion-host',
  bastionKey: 'super-private-key',
  host: 'localhost',
  hostname: 'localhost'
}

describe('psql', () => {
  let fakePsqlProcess, fakeTunnel, tunnelStub
  let sandbox
  let mockSpawn
  let psql, bastion

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    tunnelStub = sandbox.stub().callsFake((_config, callback) => {
      fakeTunnel = new TunnelStub()
      callback(null, fakeTunnel)
    })
    mockSpawn = createSpawnMocker(sandbox)
    bastion = proxyquire('../../lib/bastion', {
      'tunnel-ssh': tunnelStub
    })
    psql = proxyquire('../../lib/psql', {
      './bastion': bastion
    })
    fakePsqlProcess = new FakeChildProcess()
    sandbox.stub(Math, 'random').callsFake(() => 0)
  })

  afterEach(async () => {
    await fakePsqlProcess.teardown()
    fakeTunnel = fakePsqlProcess = undefined
    sandbox.restore()
  })

  async function ensureFinished (promise) {
    try {
      await promise
    } finally {
      if (fakeTunnel) {
        if (!fakeTunnel.exited) {
          throw new Error('tunnel was not closed')
        }
      }
      if (!fakePsqlProcess.exited) {
        throw new Error('psql process did not close')
      }
    }
  }

  describe('exec', () => {
    it('runs psql', async () => {
      const expectedEnv = Object.freeze({
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: 5432,
        PGHOST: 'localhost'
      })

      const mock = mockSpawn(
        'psql',
        ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'inherit'],
          env: expectedEnv
        }
      )

      mock.callsFake(() => {
        fakePsqlProcess.start()
        return fakePsqlProcess
      })

      const promise = psql.exec(db, 'SELECT NOW();')
      await fakePsqlProcess.waitForStart()
      mock.verify()
      await fakePsqlProcess.simulateExit(0)
      await ensureFinished(promise)
    })

    it('runs psql and throws an error if psql exits with exit code > 0', async () => {
      const expectedEnv = Object.freeze({
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: 5432,
        PGHOST: 'localhost'
      })

      const mock = mockSpawn(
        'psql',
        ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'inherit'],
          env: expectedEnv
        }
      )

      mock.callsFake(() => {
        fakePsqlProcess.start()
        return fakePsqlProcess
      })

      const promise = psql.exec(db, 'SELECT NOW();')
      await fakePsqlProcess.waitForStart()
      mock.verify()

      try {
        expect(fakePsqlProcess.exited).to.equal(false)
        await fakePsqlProcess.simulateExit(1)
        await ensureFinished(promise)
        throw new Error('psql.exec should have thrown')
      } catch (err) {
        expect(err.message).to.equal('psql exited with code 1')
      }
    })

    describe('private databases (not shield)', () => {
      it('opens an SSH tunnel and runs psql for bastion databases', async () => {
        const tunnelConf = {
          username: 'bastion',
          host: 'bastion-host',
          privateKey: 'super-private-key',
          dstHost: 'localhost',
          dstPort: 5432,
          localHost: '127.0.0.1',
          localPort: 49152
        }
        const mock = mockSpawn(
          'psql',
          ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
          sinon.match.any
        )

        mock.callsFake(() => {
          fakePsqlProcess.start()
          return fakePsqlProcess
        })
        const promise = psql.exec(bastionDb, 'SELECT NOW();', 1000)
        await fakePsqlProcess.waitForStart()
        mock.verify()
        expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true)
        await fakePsqlProcess.simulateExit(0)
        await ensureFinished(promise)
      })

      it('closes the tunnel manually if psql exits and the tunnel does not close on its own', async () => {
        const tunnelConf = {
          username: 'bastion',
          host: 'bastion-host',
          privateKey: 'super-private-key',
          dstHost: 'localhost',
          dstPort: 5432,
          localHost: '127.0.0.1',
          localPort: 49152
        }
        const mock = mockSpawn(
          'psql',
          ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
          sinon.match.any
        )

        mock.callsFake(() => {
          fakePsqlProcess.start()
          return fakePsqlProcess
        })

        const promise = psql.exec(bastionDb, 'SELECT NOW();', 1000)
        await fakePsqlProcess.waitForStart()
        mock.verify()
        expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true)
        expect(fakeTunnel.exited).to.equal(false)
        await fakePsqlProcess.simulateExit(0)
        await ensureFinished(promise)
        expect(fakeTunnel.exited).to.equal(true)
      })

      it('closes psql manually if the tunnel exits and psql does not close on its own', async () => {
        const tunnelConf = {
          username: 'bastion',
          host: 'bastion-host',
          privateKey: 'super-private-key',
          dstHost: 'localhost',
          dstPort: 5432,
          localHost: '127.0.0.1',
          localPort: 49152
        }
        const mock = mockSpawn(
          'psql',
          ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
          sinon.match.any
        )

        mock.callsFake(() => {
          fakePsqlProcess.start()
          return fakePsqlProcess
        })

        const execPromise = psql.exec(bastionDb, 'SELECT NOW();', 1000)
        await fakePsqlProcess.waitForStart()
        mock.verify()
        expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true)
        expect(fakePsqlProcess.exited).to.equal(false)
        fakeTunnel.close()
        await ensureFinished(execPromise)
        expect(fakePsqlProcess.exited).to.equal(true)
      })
    })
  })

  describe('execFile', () => {
    it('runs psql with file as input', async () => {
      const expectedEnv = Object.freeze({
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: 5432,
        PGHOST: 'localhost'
      })

      const mock = mockSpawn(
        'psql',
        ['-f', 'test.sql', '--set', 'sslmode=require'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          encoding: 'utf8',
          env: expectedEnv
        }
      )
      mock.callsFake(() => {
        fakePsqlProcess.start()
        return fakePsqlProcess
      })

      const promise = psql.execFile(db, 'test.sql')
      await fakePsqlProcess.waitForStart()
      mock.verify()
      await fakePsqlProcess.simulateExit(0)
      await ensureFinished(promise)
    })
    it('opens an SSH tunnel and runs psql for bastion databases', async () => {
      const tunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'localhost',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152
      }

      const mock = mockSpawn(
        'psql',
        ['-f', 'test.sql', '--set', 'sslmode=require'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          encoding: 'utf8',
          env: sinon.match.object
        }
      )
      mock.callsFake(() => {
        fakePsqlProcess.start()
        return fakePsqlProcess
      })

      const promise = psql.execFile(bastionDb, 'test.sql', 1000)
      await fakePsqlProcess.waitForStart()
      mock.verify()
      expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true)
      await fakePsqlProcess.simulateExit(0)
      await ensureFinished(promise)
    })
  })

  describe('psqlInteractive', () => {
    const db = {
      attachment: {
        app: {
          name: 'sleepy-hollow-9876'
        },
        name: 'DATABASE'
      }
    }

    context('when HEROKU_PSQL_HISTORY is set', () => {
      let historyPath

      function mockHerokuPSQLHistory (path) {
        process.env.HEROKU_PSQL_HISTORY = path
      }

      before(function () {
        tmp.setGracefulCleanup()
      })

      afterEach(() => {
        delete process.env.HEROKU_PSQL_HISTORY
      })

      context('when HEROKU_PSQL_HISTORY is a valid directory path', () => {
        beforeEach(() => {
          historyPath = tmp.dirSync().name
          mockHerokuPSQLHistory(historyPath)
        })

        afterEach(() => {
          fs.rmdirSync(historyPath)
        })

        it('is the directory path to per-app history files', async () => {
          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${historyPath}/sleepy-hollow-9876`,
            '--set',
            'sslmode=require'
          ]

          const expectedEnv = Object.freeze({
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          const mock = mockSpawn(
            'psql',
            expectedArgs,
            {
              stdio: 'inherit',
              env: expectedEnv
            }
          )

          mock.callsFake(() => {
            fakePsqlProcess.start()
            return fakePsqlProcess
          })

          const promise = psql.interactive(db)
          await fakePsqlProcess.waitForStart()
          await fakePsqlProcess.simulateExit(0)
          mock.verify()
          await ensureFinished(promise)
        })
      })

      context('when HEROKU_PSQL_HISTORY is a valid file path', () => {
        beforeEach(function () {
          historyPath = tmp.fileSync().name
          mockHerokuPSQLHistory(historyPath)
        })

        afterEach(() => {
          fs.unlinkSync(historyPath)
        })

        it('is the path to the history file', async () => {
          const expectedEnv = Object.freeze({
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${process.env.HEROKU_PSQL_HISTORY}`,
            '--set',
            'sslmode=require'
          ]

          const mock = mockSpawn(
            'psql',
            expectedArgs,
            {
              stdio: 'inherit',
              env: expectedEnv
            }
          )

          mock.callsFake(() => {
            fakePsqlProcess.start()
            return fakePsqlProcess
          })

          const promise = psql.interactive(db)
          await fakePsqlProcess.waitForStart()
          await fakePsqlProcess.simulateExit(0)
          mock.verify()
          await ensureFinished(promise)
        })
      })

      context('when HEROKU_PSQL_HISTORY is an invalid path', async () => {
        it('issues a warning', async () => {
          const invalidPath = path.join('/', 'path', 'to', 'history')
          mockHerokuPSQLHistory(invalidPath)

          const cli = require('heroku-cli-util')
          cli.mockConsole()

          const expectedEnv = Object.freeze({
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'sslmode=require'
          ]

          const mock = mockSpawn(
            'psql',
            expectedArgs,
            {
              stdio: 'inherit',
              env: expectedEnv
            }
          )

          mock.callsFake(() => {
            fakePsqlProcess.start()
            return fakePsqlProcess
          })

          const promise = psql.interactive(db)
          await fakePsqlProcess.waitForStart()
          await fakePsqlProcess.simulateExit(0)
          mock.verify()
          const expectedMessage = `HEROKU_PSQL_HISTORY is set but is not a valid path (${invalidPath})\n`

          await ensureFinished(promise)
          expect(unwrap(cli.stderr)).to.equal(expectedMessage)
        })
      })
    })
  })
})

function isSinonMatcher (value) {
  return typeof value === 'object' &&
    value !== null &&
    typeof value.test === 'function'
}

// create a sinon matcher that only asserts on ENV values we expect.
// we don't want to leak other ENV variables to the console in CI.
// it also makes the test output easier by not listing all the environment variables available in process.env
function matchEnv (expectedEnv) {
  const matcher = (actualEnv) => {
    const reducedActualEnv = Object.entries(expectedEnv).reduce((memo, [key, value]) => {
      if (key in actualEnv) {
        memo[key] = value
      }
      return memo
    }, {})
    sinon.match(expectedEnv).test(reducedActualEnv)

    return true
  }

  return sinon.match(matcher, 'env contains expected keys and values')
}

class FakeChildProcess extends EventEmitter {
  constructor (...args) {
    super(...args)
    this.ready = false
    this.exited = false
    this.killed = false
    this.stdout = new PassThrough()
  }

  async waitForStart () {
    if (!this.ready) {
      await once(this, 'ready')
    }
  }

  start () {
    this.ready = true
    this.emit('ready')
  }

  simulateExit (code) {
    if (!this.exited) {
      return new Promise((resolve) => {
        this.exited = true
        this.stdout.end()
        process.nextTick(() => {
          try {
            this.emit('close', code)
          } finally {
            resolve()
          }
        })
      })
    }
  }

  kill (signal) {
    this.killed = true
    this._killedWithSignal = signal
    const killedWithCode = signals[signal]
    this.simulateExit(killedWithCode)
  }

  get killedWithSignal () {
    return this._killedWithSignal
  }

  async teardown () {
    await this.simulateExit(0)
    this.removeAllListeners()
  }
}

class TunnelStub extends EventEmitter {
  constructor (...args) {
    super(...args)
    this.exited = false
  }

  close () {
    this.exited = true
    process.nextTick(() => {
      this.emit('close')
    })
  }
}

function createSpawnMocker (sandbox) {
  return function mockSpawn (commandName, expectedArgs, expectedOptions) {
    const spawnMock = sandbox.mock(ChildProcess)
    const { env: expectedEnv } = expectedOptions

    let optionsMatchers
    if (isSinonMatcher(expectedOptions)) {
      optionsMatchers = expectedOptions
    } else {
      optionsMatchers = Object.entries(expectedOptions).reduce((memo, [key, value]) => {
        let matcher
        if (key === 'env') {
          matcher = matchEnv(expectedEnv)
        } else {
          matcher = value
        }

        memo[key] = matcher
        return memo
      }, {})
    }

    return spawnMock
      .expects('spawn')
      .withArgs(
        commandName,
        sinon.match.array.deepEquals(expectedArgs),
        sinon.match(optionsMatchers)
      )
  }
}
