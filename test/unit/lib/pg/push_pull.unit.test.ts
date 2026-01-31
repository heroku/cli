import {utils} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core'
import {expect} from 'chai'
import {EventEmitter} from 'node:events'
import {Server} from 'node:net'
import {PassThrough} from 'node:stream'
import sinon from 'sinon'

import {connArgs, maybeTunnel, parseExclusions, prepare, spawnPipe, verifyExtensionsMatch} from '../../../../src/lib/pg/push_pull.js'

describe('push_pull', function () {
  describe('parseExclusions', function () {
    it('returns an empty array when rawExcludeList is undefined', function () {
      let x
      expect(parseExclusions(x)).to.deep.equal([])
    })

    it('returns an array of trimmed exclusions when rawExcludeList is a valid string', function () {
      expect(parseExclusions('table1; table2 ; table3')).to.deep.equal(['table1', 'table2', 'table3'])
    })
  })

  describe('prepare', function () {
    describe('local database operations', function () {
      let execStub: sinon.SinonStub

      beforeEach(function () {
        execStub = sinon.stub()
      })

      it('creates a local database when host is localhost', async function () {
        const target = {
          database: 'cats_doing_stuff',
          host: 'localhost',
          port: '5432',
          user: 'me',
        }

        await prepare(target as any, execStub)

        expect(execStub.calledOnce).to.be.true
        expect(execStub.firstCall.args[0]).to.equal('createdb -U me -h localhost -p 5432 cats_doing_stuff')
      })

      it('creates a local database when host is not specified', async function () {
        const target = {
          database: 'dogs_that_thing_they_are_cats',
          port: '5432',
          user: 'you',
        }

        await prepare(target as any, execStub)

        expect(execStub.calledOnce).to.be.true
        expect(execStub.firstCall.args[0]).to.equal('createdb -U you -p 5432 dogs_that_thing_they_are_cats')
      })
    })

    describe('remote database operations', function () {
      const randomValue = 0.9794701999754457
      const emptyMarker = `${randomValue}${randomValue}`
      const target = {
        database: 'firecrackers',
        host: 'heroku.com',
        port: '5432',
        user: 'vic',
      }

      let uxErrorStub: sinon.SinonStub

      beforeEach(function () {
        sinon.stub(Math, 'random').returns(randomValue)
        uxErrorStub = sinon.stub(ux, 'error')
      })

      afterEach(function () {
        sinon.restore()
      })

      it('prints an error message if the database is not empty', async function () {
        sinon
          .stub(utils.pg.PsqlService.prototype, 'execQuery')
          .resolves('hello')

        await prepare(target as any)
        expect(uxErrorStub.calledOnce).to.be.true
        expect(uxErrorStub.firstCall.args[0]).to.matches(/Remote database is not empty/)
      })

      it('is silent when the remote database is empty', async function () {
        sinon
          .stub(utils.pg.PsqlService.prototype, 'execQuery')
          .resolves(emptyMarker)

        await prepare(target as any)
        expect(uxErrorStub.calledOnce).to.be.false
      })
    })
  })

  describe('maybeTunnel', function () {
    const target = {
      database: 'firecrackers',
      host: 'heroku.com',
      port: '5432',
      user: 'vic',
    }

    const dbTunnelConfig = {
      localHost: '127.0.0.1',
      localPort: 49152,
    }

    afterEach(function () {
      sinon.restore()
    })

    it('returns connection details containing tunnel config, when a tunnel is configured', async function () {
      const fakeTunnel = {close: sinon.stub()} as unknown as Server
      sinon.stub(utils.pg.psql, 'getPsqlConfigs').returns({dbTunnelConfig} as any)
      sinon.stub(utils.pg.psql, 'sshTunnel').resolves(fakeTunnel)

      const result = await maybeTunnel(target as any)

      expect(result.host).to.equal(dbTunnelConfig.localHost)
      expect(result.port).to.equal(dbTunnelConfig.localPort.toString())
      expect(result._tunnel).to.equal(fakeTunnel)
      expect(result.database).to.equal(target.database)
      expect(result.user).to.equal(target.user)
    })

    it('does not return tunnel config in the connection details, when a tunnel is not configured', async function () {
      sinon.stub(utils.pg.psql, 'getPsqlConfigs').returns({dbTunnelConfig} as any)
      sinon.stub(utils.pg.psql, 'sshTunnel').resolves(undefined)

      const result = await maybeTunnel(target as any)

      expect(result.host).to.equal(target.host)
      expect(result.port).to.equal(target.port)
      expect(result._tunnel).to.be.undefined
      expect(result.database).to.equal(target.database)
      expect(result.user).to.equal(target.user)
    })
  })

  describe('connArgs', function () {
    it('pushes the -U, -h, -p, and -d flags into the args array when connection details contain a user, host, and port and skipDFlag is not specified', function () {
      const actual = connArgs({host: 'heroku.com', port: 5432, user: 'john-rambo'} as any)
      const expected  = ['-U', 'john-rambo', '-h', 'heroku.com', '-p', 5432, '-d', undefined]

      expect(actual).to.eql(expected)
    })

    it('does not push a -U flag into the args array when connection details do not contain a user', function () {
      const actual = connArgs({host: 'heroku.com', port: 5432} as any)
      const expected = ['-h', 'heroku.com', '-p', 5432, '-d', undefined]

      expect(actual).to.eql(expected)
    })

    it('does not push a -h flag into the args array when connection details do not contain a host', function () {
      const actual = connArgs({port: 5432, user: 'john-rambo'} as any)
      const expected = ['-U', 'john-rambo', '-p', 5432, '-d', undefined]

      expect(actual).to.eql(expected)
    })

    it('does not push a -p flag into the args array when connection details do not contain a port', function () {
      const actual = connArgs({host: 'heroku.com', user: 'john-rambo'} as any)
      const expected = ['-U', 'john-rambo', '-h', 'heroku.com', '-d', undefined]

      expect(actual).to.eql(expected)
    })

    it('pushes the -d flag into the args array when the `skipDFlag` argument is provided as `false`', function () {
      const actual = connArgs({host: 'heroku.com', port: 5432, user: 'john-rambo'} as any, false)
      const expected = ['-U', 'john-rambo', '-h', 'heroku.com', '-p', 5432, '-d', undefined]

      expect(actual).to.eql(expected)
    })

    it('does not push a -d flag into the args array when the `skipDFlag` argument is provided as `true`', function () {
      const actual = connArgs({host: 'heroku.com', port: 5432, user: 'john-rambo'} as any, true)
      const expected = ['-U', 'john-rambo', '-h', 'heroku.com', '-p', 5432, undefined]

      expect(actual).to.eql(expected)
    })

    it('pushes the connection detail value for database into the args array', function () {
      const actual = connArgs({
        database: 'favorite-candy',
        host: 'heroku.com',
        port: 5432,
        user: 'john-rambo',
      } as any)
      const expected = ['-U', 'john-rambo', '-h', 'heroku.com', '-p', 5432, '-d', 'favorite-candy']

      expect(actual).to.eql(expected)
    })
  })

  describe('spawnPipe', function () {
    it('resolves when both pgDump and pgRestore close successfully', async function () {
      const pgDump = new EventEmitter() as {stdout: PassThrough} & EventEmitter
      const pgRestore = new EventEmitter() as {stdin: PassThrough} & EventEmitter
      pgDump.stdout = new PassThrough()
      pgRestore.stdin = new PassThrough()

      const promise = spawnPipe(pgDump as any, pgRestore as any)

      pgDump.emit('close', 0)
      pgRestore.emit('close', 0)

      await expect(promise).to.eventually.be.fulfilled
    })

    it('rejects with pg_dump error when pgDump closes with non-zero code', async function () {
      const pgDump = new EventEmitter() as {stdout: PassThrough} & EventEmitter
      const pgRestore = new EventEmitter() as {stdin: PassThrough} & EventEmitter
      pgDump.stdout = new PassThrough()
      pgRestore.stdin = new PassThrough()

      const promise = spawnPipe(pgDump as any, pgRestore as any)

      pgDump.emit('close', 1)

      await expect(promise).to.eventually.be.rejectedWith('pg_dump errored with 1')
    })

    it('rejects with pg_restore error when pgRestore closes with non-zero code', async function () {
      const pgDump = new EventEmitter() as {stdout: PassThrough} & EventEmitter
      const pgRestore = new EventEmitter() as {stdin: PassThrough} & EventEmitter
      pgDump.stdout = new PassThrough()
      pgRestore.stdin = new PassThrough()

      const promise = spawnPipe(pgDump as any, pgRestore as any)

      pgDump.emit('close', 0)
      pgRestore.emit('close', 1)

      await expect(promise).to.eventually.be.rejectedWith('pg_restore errored with 1')
    })

    it('pipes pgDump stdout to pgRestore stdin', async function () {
      const pgDump = new EventEmitter() as {stdout: PassThrough} & EventEmitter
      const pgRestore = new EventEmitter() as {stdin: PassThrough} & EventEmitter
      pgDump.stdout = new PassThrough()
      pgRestore.stdin = new PassThrough()

      const chunks: Buffer[] = []
      pgRestore.stdin.on('data', (chunk: Buffer) => chunks.push(chunk))

      spawnPipe(pgDump as any, pgRestore as any)

      pgDump.stdout.write('test data')
      pgDump.emit('close', 0)
      pgRestore.emit('close', 0)

      expect(Buffer.concat(chunks).toString()).to.equal('test data')
    })

    it('ends pgRestore stdin when pgDump closes successfully', async function () {
      const pgDump = new EventEmitter() as {stdout: PassThrough} & EventEmitter
      const pgRestore = new EventEmitter() as {stdin: PassThrough} & EventEmitter
      pgDump.stdout = new PassThrough()
      pgRestore.stdin = new PassThrough()

      const endSpy = sinon.spy(pgRestore.stdin, 'end')

      spawnPipe(pgDump as any, pgRestore as any)

      pgDump.emit('close', 0)
      pgRestore.emit('close', 0)

      expect(endSpy.calledOnce).to.be.true
    })
  })

  describe('verifyExtensionsMatch', function () {
    // cspell:ignore plpgsql

    let uxWarnStub: sinon.SinonStub
    let execQueryStub: sinon.SinonStub

    const source = {
      database: 'source_db',
      host: 'localhost',
      port: '5432',
      user: 'user1',
    }
    const target = {
      database: 'target_db',
      host: 'localhost',
      port: '5432',
      user: 'user2',
    }

    beforeEach(function () {
      uxWarnStub = sinon.stub(ux, 'warn')
    })

    afterEach(function () {
      sinon.restore()
    })

    it('does not warn when extensions match', async function () {
      const extensions = 'plpgsql\nuuid-ossp\n'
      execQueryStub = sinon.stub(utils.pg.PsqlService.prototype, 'execQuery').resolves(extensions)

      await verifyExtensionsMatch(source as any, target as any)

      expect(uxWarnStub.called).to.be.false
    })

    it('warns when extensions differ between source and target', async function () {
      execQueryStub = sinon.stub(utils.pg.PsqlService.prototype, 'execQuery')
      execQueryStub.onFirstCall().resolves('plpgsql\n')  // target
      execQueryStub.onSecondCall().resolves('plpgsql\nuuid-ossp\n')  // source

      await verifyExtensionsMatch(source as any, target as any)

      expect(uxWarnStub.calledOnce).to.be.true
    })

    it('includes both extension lists in the warning message', async function () {
      const targetExtensions = 'plpgsql\n'
      const sourceExtensions = 'plpgsql\nuuid-ossp\n'
      execQueryStub = sinon.stub(utils.pg.PsqlService.prototype, 'execQuery')
      execQueryStub.onFirstCall().resolves(targetExtensions)
      execQueryStub.onSecondCall().resolves(sourceExtensions)

      await verifyExtensionsMatch(source as any, target as any)

      const warningMessage = uxWarnStub.firstCall.args[0]
      expect(warningMessage).to.include(targetExtensions)
      expect(warningMessage).to.include(sourceExtensions)
      expect(warningMessage).to.include('Extensions in newly created target database differ')
    })

    it('queries both databases for installed extensions', async function () {
      execQueryStub = sinon.stub(utils.pg.PsqlService.prototype, 'execQuery')

      await verifyExtensionsMatch(source as any, target as any)

      expect(execQueryStub.calledTwice).to.be.true
      expect(execQueryStub.firstCall.args[0]).to.equal('SELECT extname FROM pg_extension ORDER BY extname;')
      expect(execQueryStub.secondCall.args[0]).to.equal('SELECT extname FROM pg_extension ORDER BY extname;')
    })
  })
})

