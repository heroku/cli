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
const expect = require('unexpected')

const unwrap = require('../unwrap')

class FakeChildProcess extends EventEmitter {
  constructor (...args) {
    super(...args)
    this.ready = false
    this._exited = false
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
  async simulateExit (code) {
    if (!this._exited) {
      this._exited = true
      this.stdout.end()
      const waitForClose = once(this, 'close')
      this.emit('close', code)
      await waitForClose
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

async function ensureFinished (promise, callback) {
  await callback()
  await promise
}

function isSinonMatcher (value) {
  return typeof value === 'object' &&
    value !== null &&
    typeof value.test === 'function'
}

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

describe('psql', () => {
  let fakeChildProcess
  let sandbox
  let mockSpawn

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    mockSpawn = createSpawnMocker(sandbox)
    fakeChildProcess = new FakeChildProcess()
    sandbox.stub(Math, 'random').callsFake(() => 0)
  })

  afterEach(async () => {
    sandbox.restore()
    await fakeChildProcess.teardown()
  })

  describe('exec', () => {
    let tunnelStub
    let bastion
    let psql

    beforeEach(() => {
      tunnelStub = sandbox.stub().callsArg(1)
      bastion = proxyquire('../../lib/bastion', {
        'tunnel-ssh': tunnelStub
      })
      psql = proxyquire('../../lib/psql', {
        './bastion': bastion
      })
    })

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

      const fakeChildProcess = new FakeChildProcess()
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
        fakeChildProcess.start()
        return fakeChildProcess
      })

      await ensureFinished(psql.exec(db, 'SELECT NOW();'), async () => {
        await fakeChildProcess.waitForStart()
        mock.verify()
        await fakeChildProcess.simulateExit(0)
      })
    })
    it('opens an SSH tunnel and runs psql for bastion databases', async () => {
      let tunnelConf = {
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
        fakeChildProcess.start()
        return fakeChildProcess
      })
      await ensureFinished(psql.exec(bastionDb, 'SELECT NOW();', 1000), async () => {
        await fakeChildProcess.waitForStart()
        mock.verify()
        expect(tunnelStub.withArgs(tunnelConf).calledOnce, 'to equal', true)
        await fakeChildProcess.simulateExit(0)
      })
    })
  })

  describe('execFile', () => {
    let sandbox
    let tunnelStub
    let bastion
    let psql

    beforeEach(() => {
      sandbox = sinon.createSandbox()
      tunnelStub = sandbox.stub().callsArg(1)
      bastion = proxyquire('../../lib/bastion', {
        'tunnel-ssh': tunnelStub
      })
      psql = proxyquire('../../lib/psql', {
        './bastion': bastion
      })
    })

    afterEach(() => {
      sandbox.restore()
    })

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
        ['-f', 'test.sql', '--set', 'sslmode=require'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          encoding: 'utf8',
          env: expectedEnv
        }
      )
      mock.callsFake(() => {
        fakeChildProcess.start()
        return fakeChildProcess
      })

      await ensureFinished(psql.execFile(db, 'test.sql'), async () => {
        await fakeChildProcess.waitForStart()
        mock.verify()
        await fakeChildProcess.simulateExit(0)
      })
    })
    it('opens an SSH tunnel and runs psql for bastion databases', async () => {
      let tunnelConf = {
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
        fakeChildProcess.start()
        return fakeChildProcess
      })

      await ensureFinished(psql.execFile(bastionDb, 'test.sql', 1000), async () => {
        await fakeChildProcess.waitForStart()
        mock.verify()
        expect(tunnelStub.withArgs(tunnelConf).calledOnce, 'to equal', true)
        await fakeChildProcess.simulateExit(0)
      })
    })
  })

  describe('psqlInteractive', () => {
    const psql = proxyquire('../../lib/psql', {})
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
      let envStub

      function mockHerokuPSQLHistory(path) {
        envStub = sandbox.stub()
        const envProxy = new Proxy(process.env, {
          get(target, prop, receiver) {
            if (prop === 'HEROKU_PSQL_HISTORY') {
              envStub()
              return path
            }
            return target[prop]
          }
        })
        sandbox.stub(process, 'env').value(envProxy)
        return envStub;
      }

      afterEach(() => {
        if (envStub) {
          expect(envStub.callCount, 'to be greater than or equal to', 1)
          envStub = undefined
        }
        tmp.setGracefulCleanup()
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
            fakeChildProcess.start()
            return fakeChildProcess
          })

          await ensureFinished(psql.interactive(db), async () => {
            await fakeChildProcess.waitForStart()
            await fakeChildProcess.simulateExit(0)
            mock.verify()
          })
        })
      })

      context('when HEROKU_PSQL_HISTORY is a valid file path', () => {
        beforeEach(function() {
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
            fakeChildProcess.start()
            return fakeChildProcess
          })

          await ensureFinished(psql.interactive(db), async () => {
            await fakeChildProcess.waitForStart()
            await fakeChildProcess.simulateExit(0)
            mock.verify()
          })
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
            fakeChildProcess.start()
            return fakeChildProcess
          })

          await ensureFinished(psql.interactive(db), async () => {
            await fakeChildProcess.waitForStart()
            await fakeChildProcess.simulateExit(0)
            mock.verify()
            const expectedMessage = `HEROKU_PSQL_HISTORY is set but is not a valid path (${invalidPath})\n`

            expect(unwrap(cli.stderr), 'to equal', expectedMessage)
          })
        })
      })
    })
  })
})
