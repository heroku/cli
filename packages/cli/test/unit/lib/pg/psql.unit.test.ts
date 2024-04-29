import {expect} from '@oclif/test'
import * as ChildProcess from 'child_process'
import {EventEmitter, once} from 'node:events'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {PassThrough} from 'node:stream'
import * as proxyquire from 'proxyquire'
import type {SinonExpectation} from 'sinon'
import {stderr} from 'stdout-stderr'
import type {ConnectionDetailsWithAttachment} from '../../../../src/lib/pg/util'
import {unwrap} from '../../../helpers/utils/unwrap'
import sinon = require('sinon')
import * as tmp from 'tmp'
import type * as Pgsql from '../../../../src/lib/pg/psql'
import type * as Bastion from '../../../../src/lib/pg/bastion'
import {constants, SignalConstants} from 'os'

describe('psql', () => {
  const db: ConnectionDetailsWithAttachment = {
    attachment: {} as ConnectionDetailsWithAttachment['attachment'],
    user: 'jeff',
    password: 'pass',
    database: 'mydb',
    port: '5432',
    host: 'localhost',
    pathname: '/mydb',
    bastionHost: '',
    bastionKey: '',
    url: '',
  }

  const bastionDb: ConnectionDetailsWithAttachment = {
    attachment: {} as  ConnectionDetailsWithAttachment['attachment'],
    user: 'jeff',
    password: 'pass',
    database: 'mydb',
    port: '5432',
    pathname: '/mydb',
    bastionHost: 'bastion-host',
    bastionKey: 'super-private-key',
    host: 'localhost',
    url: '',
  }

  const NOW_OUTPUT = `
  now
  -------------------------------
   2020-12-16 09:54:01.916894-08
  (1 row)
  `

  const VERSION_OUTPUT = `
  server_version
  -------------------------------
  11.16 (Ubuntu 11.16-1.pgdg20.04+1)
  (1 row)
  `

  let fakePsqlProcess: FakeChildProcess | undefined
  let fakeTunnel: TunnelStub | undefined
  let tunnelStub: sinon.SinonStub<any[], any>
  let sandbox: sinon.SinonSandbox
  let mockSpawn: ReturnType<typeof createSpawnMocker>
  let psql: typeof Pgsql
  let bastion: typeof Bastion

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    tunnelStub = sandbox.stub().callsFake((_config, callback) => {
      fakeTunnel = new TunnelStub()
      callback(null, fakeTunnel)
    })
    mockSpawn = createSpawnMocker(sandbox)
    bastion = proxyquire('../../../../src/lib/pg/bastion', {
      'tunnel-ssh': tunnelStub,
    })
    psql = proxyquire('../../../../src/lib/pg/psql', {
      './bastion': bastion,
    })
    fakePsqlProcess = new FakeChildProcess()
    sandbox.stub(Math, 'random').callsFake(() => 0)
    stderr.start()
  })

  afterEach(async () => {
    await fakePsqlProcess?.teardown()
    // eslint-disable-next-line no-multi-assign
    fakeTunnel = fakePsqlProcess = undefined
    sandbox.restore()
    stderr.stop()
  })

  async function ensureFinished(promise: Promise<unknown>) {
    try {
      return await promise
    } catch (error) {
      if (fakeTunnel) {
        if (!fakeTunnel?.exited) {
          throw new Error('tunnel was not closed')
        }
      }

      if (!fakePsqlProcess?.exited) {
        throw new Error('psql process did not close')
      }

      throw error
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
        PGPORT: '5432',
        PGHOST: 'localhost',
      })

      const mock = mockSpawn(
        'psql',
        ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          env: expectedEnv,
        },
      )

      mock.callsFake(() => {
        fakePsqlProcess?.start()
        return fakePsqlProcess
      })

      const promise = psql.exec(db, 'SELECT NOW();')
      await fakePsqlProcess?.waitForStart()
      mock.verify()
      fakePsqlProcess?.stdout.write(NOW_OUTPUT)
      await fakePsqlProcess?.simulateExit(0)
      const output = await ensureFinished(promise)
      expect(output).to.equal(NOW_OUTPUT)
    })

    it('runs psql with supplied args', async () => {
      const expectedEnv = Object.freeze({
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: '5432',
        PGHOST: 'localhost',
      })

      const mock = mockSpawn(
        'psql',
        ['-c', 'SELECT NOW();', '--set', 'sslmode=require', '-t', '-q'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          env: expectedEnv,
        },
      )

      mock.callsFake(() => {
        fakePsqlProcess?.start()
        return fakePsqlProcess
      })

      const promise = psql.exec(db, 'SELECT NOW();', ['-t', '-q'])
      await fakePsqlProcess?.waitForStart()
      mock.verify()
      fakePsqlProcess?.stdout.write(NOW_OUTPUT)
      await fakePsqlProcess?.simulateExit(0)
      const output = await ensureFinished(promise)
      expect(output).to.equal(NOW_OUTPUT)
    })

    it('runs psql and throws an error if psql exits with exit code > 0', async () => {
      const expectedEnv = Object.freeze({
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: '5432',
        PGHOST: 'localhost',
      })

      const mock = mockSpawn(
        'psql',
        ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          env: expectedEnv,
        },
      )

      mock.callsFake(() => {
        fakePsqlProcess?.start()
        return fakePsqlProcess
      })

      const promise = psql.exec(db, 'SELECT NOW();')
      await fakePsqlProcess?.waitForStart()
      mock.verify()

      try {
        // await promise
        expect(fakePsqlProcess?.exited).to.equal(false)
        await fakePsqlProcess?.simulateExit(1)
        await ensureFinished(promise)
        throw new Error('psql.exec should have thrown')
      } catch (error) {
        const {message} = error as {message: string}
        expect(message).to.equal('psql exited with code 1')
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
          localPort: 49152,
        }
        const mock = mockSpawn(
          'psql',
          ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
          sinon.match.any as unknown as Parameters<typeof mockSpawn>[2],
        )

        mock.callsFake(() => {
          fakePsqlProcess?.start()
          return fakePsqlProcess
        })
        const promise = psql.exec(bastionDb, 'SELECT NOW();')
        await fakePsqlProcess?.waitForStart()
        mock.verify()
        expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true)
        await fakePsqlProcess?.simulateExit(0)
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
          localPort: 49152,
        }
        const mock = mockSpawn(
          'psql',
          ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
          sinon.match.any as unknown as Parameters<typeof mockSpawn>[2],
        )

        mock.callsFake(() => {
          fakePsqlProcess?.start()
          return fakePsqlProcess
        })

        const promise = psql.exec(bastionDb, 'SELECT NOW();')
        await fakePsqlProcess?.waitForStart()
        mock.verify()
        expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true)
        expect(fakeTunnel?.exited).to.equal(false)
        await fakePsqlProcess?.simulateExit(0)
        await ensureFinished(promise)
        expect(fakeTunnel?.exited).to.equal(true)
      })

      it('closes psql manually if the tunnel exits and psql does not close on its own', async () => {
        const tunnelConf = {
          username: 'bastion',
          host: 'bastion-host',
          privateKey: 'super-private-key',
          dstHost: 'localhost',
          dstPort: 5432,
          localHost: '127.0.0.1',
          localPort: 49152,
        }
        const mock = mockSpawn(
          'psql',
          ['-c', 'SELECT NOW();', '--set', 'sslmode=require'],
          sinon.match.any as unknown as Parameters<typeof mockSpawn>[2],
        )

        mock.callsFake(() => {
          fakePsqlProcess?.start()
          return fakePsqlProcess
        })

        const execPromise = psql.exec(bastionDb, 'SELECT NOW();')
        await fakePsqlProcess?.waitForStart()
        mock.verify()
        expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true)
        expect(fakePsqlProcess?.exited).to.equal(false)
        fakeTunnel?.close()
        await ensureFinished(execPromise)
        expect(fakePsqlProcess?.exited).to.equal(true)
      })
    })
  })

  describe('fetchVersion', () => {
    it('gets the server version', async () => {
      const expectedEnv = Object.freeze({
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: '5432',
        PGHOST: 'localhost',
      })

      const mock = mockSpawn(
        'psql',
        ['-c', 'SHOW server_version', '--set', 'sslmode=require', '-X', '-q'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          env: expectedEnv,
        },
      )

      mock.callsFake(() => {
        fakePsqlProcess?.start()
        return fakePsqlProcess
      })

      const promise = psql.fetchVersion(db)
      await fakePsqlProcess?.waitForStart()
      mock.verify()
      fakePsqlProcess?.stdout.write(VERSION_OUTPUT)
      await fakePsqlProcess?.simulateExit(0)
      const output = await ensureFinished(promise)
      expect(output).to.equal('11.16')
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
        PGPORT: '5432',
        PGHOST: 'localhost',
      })

      const mock = mockSpawn(
        'psql',
        ['-f', 'test.sql', '--set', 'sslmode=require'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          env: expectedEnv,
        },
      )
      mock.callsFake(() => {
        fakePsqlProcess?.start()
        return fakePsqlProcess
      })

      const promise = psql.execFile(db, 'test.sql')
      await fakePsqlProcess?.waitForStart()
      mock.verify()
      await fakePsqlProcess?.simulateExit(0)
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
        localPort: 49152,
      }

      const mock = mockSpawn(
        'psql',
        ['-f', 'test.sql', '--set', 'sslmode=require'],
        {
          stdio: ['ignore', 'pipe', 'inherit'],
          env: sinon.match.object as unknown as Parameters<typeof mockSpawn>[2]['env'],
        },
      )
      mock.callsFake(() => {
        fakePsqlProcess?.start()
        return fakePsqlProcess
      })

      const promise = psql.execFile(bastionDb, 'test.sql')
      await fakePsqlProcess?.waitForStart()
      mock.verify()
      expect(tunnelStub.withArgs(tunnelConf).calledOnce).to.equal(true)
      await fakePsqlProcess?.simulateExit(0)
      await ensureFinished(promise)
    })
  })

  describe('psqlInteractive', () => {
    const db = {
      attachment: {
        app: {
          name: 'sleepy-hollow-9876',
        },
        name: 'DATABASE',
      },
    } as ConnectionDetailsWithAttachment

    context('when HEROKU_PSQL_HISTORY is set', () => {
      let historyPath: string

      function mockHerokuPSQLHistory(path: string) {
        process.env.HEROKU_PSQL_HISTORY = path
      }

      before(() => {
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
            'sslmode=require',
          ]

          const expectedEnv = Object.freeze({
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer',
          })

          const mock = mockSpawn(
            'psql',
            expectedArgs,
            {
              stdio: 'inherit',
              env: expectedEnv,
            },
          )

          mock.callsFake(() => {
            fakePsqlProcess?.start()
            return fakePsqlProcess
          })

          const promise = psql.interactive(db)
          await fakePsqlProcess?.waitForStart()
          await fakePsqlProcess?.simulateExit(0)
          mock.verify()
          const output = await ensureFinished(promise)
          // psql interactive doesn't pipe output to the process
          // ensure promise returned resolves with a promise anyway
          expect(output).to.equal('')
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
            PGSSLMODE: 'prefer',
          })

          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${process.env.HEROKU_PSQL_HISTORY}`,
            '--set',
            'sslmode=require',
          ]

          const mock = mockSpawn(
            'psql',
            expectedArgs,
            {
              stdio: 'inherit',
              env: expectedEnv,
            },
          )

          mock.callsFake(() => {
            fakePsqlProcess?.start()
            return fakePsqlProcess
          })

          const promise = psql.interactive(db)
          await fakePsqlProcess?.waitForStart()
          await fakePsqlProcess?.simulateExit(0)
          mock.verify()
          const output = await ensureFinished(promise)
          // psql interactive doesn't pipe output to the process
          // ensure promise returned resolves with a promise anyway
          expect(output).to.equal('')
        })
      })

      context('when HEROKU_PSQL_HISTORY is an invalid path', () => {
        it('issues a warning', async () => {
          const invalidPath = path.join('/', 'path', 'to', 'history')
          mockHerokuPSQLHistory(invalidPath)

          const expectedEnv = Object.freeze({
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer',
          })

          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'sslmode=require',
          ]

          const mock = mockSpawn(
            'psql',
            expectedArgs,
            {
              stdio: 'inherit',
              env: expectedEnv,
            },
          )

          mock.callsFake(() => {
            fakePsqlProcess?.start()
            return fakePsqlProcess
          })

          const promise = psql.interactive(db)
          await fakePsqlProcess?.waitForStart()
          await fakePsqlProcess?.simulateExit(0)
          mock.verify()
          const expectedMessage = `Warning: HEROKU_PSQL_HISTORY is set but is not a valid path (${invalidPath})\n`

          await ensureFinished(promise)
          expect(unwrap(stderr.output)).to.equal(expectedMessage)
        })
      })
    })
  })
})

function isSinonMatcher(value: unknown): value is {test: CallableFunction} {
  return Boolean(value && typeof value === 'object' && 'test' in value && typeof (value as {test: unknown}).test === 'function')
}

// create a sinon matcher that only asserts on ENV values we expect.
// we don't want to leak other ENV variables to the console in CI.
// it also makes the test output easier by not listing all the environment variables available in process.env
function matchEnv(expectedEnv: NodeJS.ProcessEnv) {
  const matcher = (actualEnv: NodeJS.ProcessEnv) => {
    const reducedActualEnv = Object.entries(expectedEnv).reduce((memo, [key, value]) => {
      if (key in actualEnv) {
        memo[key] = value as string
      }

      return memo
    }, {} as Record<string, string>)
    sinon.match(expectedEnv).test(reducedActualEnv)

    return true
  }

  return sinon.match(matcher, 'env contains expected keys and values')
}

class FakeChildProcess extends EventEmitter {
  public ready = false
  public exited = false
  public killed = false
  public stdout = new PassThrough()
  private _killedWithSignal: keyof SignalConstants | undefined

  async waitForStart() {
    if (!this.ready) {
      await once(this, 'ready')
    }
  }

  start() {
    this.ready = true
    this.emit('ready')
  }

  async simulateExit(code: number): Promise<void> {
    if (!this.exited) {
      return new Promise(resolve => {
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

  kill(signal: keyof SignalConstants): void {
    this.killed = true
    this._killedWithSignal = signal
    const killedWithCode = constants.signals[signal]
    this.simulateExit(killedWithCode)
  }

  get killedWithSignal() {
    return this._killedWithSignal
  }

  async teardown() {
    await this.simulateExit(0)
    this.removeAllListeners()
  }
}

class TunnelStub extends EventEmitter {
  public exited = false

  close() {
    this.exited = true
    process.nextTick(() => {
      this.emit('close')
    })
  }
}

function createSpawnMocker(sandbox: sinon.SinonSandbox): (commandName: string, expectedArgs: string[], expectedOptions: ChildProcess.SpawnOptions & {env: NodeJS.ProcessEnv}) => SinonExpectation {
  return function (commandName: string, expectedArgs: string[], expectedOptions: ChildProcess.SpawnOptions & {env: NodeJS.ProcessEnv}) {
    const spawnMock = sandbox.mock(ChildProcess)
    const {env: expectedEnv} = expectedOptions

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
      }, {} as Record<string, string>)
    }

    return spawnMock
      .expects('spawn')
      .withArgs(
        commandName,
        sinon.match.array.deepEquals(expectedArgs),
        sinon.match(optionsMatchers),
      )
  }
}
