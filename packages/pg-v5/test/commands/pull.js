'use strict'

/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const expect = require('unexpected')
const env = require('process').env

let db

const fetcher = () => ({
  database: () => db
})

let tunnelStub
let bastion
let push
let pull
let emptyResponse

let opts = { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'inherit'] }

let stdoutHandler = function (key, func) {
  func('result')
}

let exitHandler = function (key, func) {
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
          name: 'postgres-1'
        },
        config_vars: ['DATABASE_URL'],
        app: {name: 'myapp'}
      }
    }

    tunnelStub = sinon.stub().callsArg(1)

    bastion = proxyquire('../../lib/bastion', {
      'tunnel-ssh': tunnelStub
    })

    push = proxyquire('../../commands/pull', {
      '../lib/fetcher': fetcher,
      '../lib/bastion': bastion
    })[0]

    pull = proxyquire('../../commands/pull', {
      '../lib/fetcher': fetcher,
      '../lib/bastion': bastion
    })[1]

    sinon.stub(Math, 'random', function () {
      return 0
    })
    emptyResponse = '00'
  })

  afterEach(() => {
    Math.random.restore()
  })

  describe('push', () => {
    afterEach(() => {
      delete env.PGPORT
    })

    it('pushes out a db', sinon.test(() => {
      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec').returns(Promise.resolve(emptyResponse))

      let cp = sinon.mock(require('child_process'))
      let cmd = 'env PGSSLMODE=prefer pg_dump --verbose -F c -Z 0      localdb | env PGPASSWORD="pass" pg_restore --verbose --no-acl --no-owner -U jeff -h herokai.com -p 5432 -d mydb'
      cp.expects('spawn').withExactArgs(cmd, [], opts).once().returns(
        {
          stdout: {
            on: stdoutHandler
          },
          on: exitHandler
        }
      )

      return push.run({args: {source: 'localdb', target: 'postgres-1'}, flags: {}})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pushing localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => psql.exec.restore())
    }))

    it('pushes out a db using url port', sinon.test(() => {
      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec').returns(Promise.resolve(emptyResponse))
      let cp = sinon.mock(require('child_process'))
      let cmd = 'env PGSSLMODE=prefer pg_dump --verbose -F c -Z 0   -h localhost -p 5433  localdb | env PGPASSWORD="pass" pg_restore --verbose --no-acl --no-owner -U jeff -h herokai.com -p 5432 -d mydb'

      cp.expects('spawn').withExactArgs(cmd, [], opts).once().returns(
        {
          stdout: {
            on: stdoutHandler
          },
          on: exitHandler
        }
      )

      return push.run({args: {source: 'postgres://localhost:5433/localdb', target: 'postgres-1'}, flags: {}})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pushing postgres://localhost:5433/localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => psql.exec.restore())
    }))

    it('pushes out a db using PGPORT', sinon.test(() => {
      env.PGPORT = 5433

      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec').returns(Promise.resolve(emptyResponse))
      let cp = sinon.mock(require('child_process'))

      let cmd = 'env PGSSLMODE=prefer pg_dump --verbose -F c -Z 0    -p 5433  localdb | env PGPASSWORD="pass" pg_restore --verbose --no-acl --no-owner -U jeff -h herokai.com -p 5432 -d mydb'
      cp.expects('spawn').withExactArgs(cmd, [], opts).once().returns(
        {
          stdout: {
            on: stdoutHandler
          },
          on: exitHandler
        }
      )

      return push.run({args: {source: 'localdb', target: 'postgres-1'}, flags: {}})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pushing localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => psql.exec.restore())
    }))

    it('opens an SSH tunnel and runs pg_dump for bastion databases', sinon.test(() => {
      db.bastionHost = 'bastion-host'
      db.bastionKey = 'super-private-key'

      let tunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'herokai.com',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152
      }

      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec').returns(Promise.resolve(emptyResponse))
      let cp = sinon.mock(require('child_process'))
      let cmd = 'env PGSSLMODE=prefer pg_dump --verbose -F c -Z 0      localdb | env PGPASSWORD="pass" pg_restore --verbose --no-acl --no-owner -U jeff -h herokai.com -p 5432 -d mydb'
      cp.expects('spawn').withExactArgs(cmd, [], opts).once().returns(
        {
          stdout: {
            on: stdoutHandler
          },
          on: exitHandler
        }
      )

      return push.run({args: {source: 'localdb', target: 'postgres-1'}, flags: {}})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pushing localdb ---> postgres-1\nheroku-cli: Pushing complete.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => expect(
        tunnelStub.withArgs(tunnelConf).calledOnce, 'to equal', true)
      )
      .then(() => psql.exec.restore())
    }))

    it('exits non-zero when there is an error', sinon.test(() => {
      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec').returns(Promise.resolve(emptyResponse))

      let cp = sinon.mock(require('child_process'))
      let cmd = 'env PGSSLMODE=prefer pg_dump --verbose -F c -Z 0      localdb | env PGPASSWORD="pass" pg_restore --verbose --no-acl --no-owner -U jeff -h herokai.com -p 5432 -d mydb'
      cp.expects('spawn').withExactArgs(cmd, [], opts).once().returns(
        {
          stdout: {
            on: stdoutHandler
          },
          on: function (key, func) {
            func(1)
          }
        }
      )

      return expect(push.run({args: {source: 'localdb', target: 'postgres-1'}, flags: {}}), 'to be rejected with', {code: 1})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pushing localdb ---> postgres-1\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => psql.exec.restore())
    }))
  })

  describe('pull', () => {
    it('pulls a db in', sinon.test(() => {
      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec')
      let cp = sinon.mock(require('child_process'))
      cp.expects('execSync').withExactArgs('createdb     localdb', {stdio: 'inherit'}).once()

      let cmd = 'env PGPASSWORD="pass" PGSSLMODE=prefer pg_dump --verbose -F c -Z 0  -U jeff -h herokai.com -p 5432  mydb | env pg_restore --verbose --no-acl --no-owner    -d localdb'
      cp.expects('spawn').withExactArgs(cmd, [], opts).once().returns(
        {
          stdout: {
            on: stdoutHandler
          },
          on: exitHandler
        }
      )

      return pull.run({args: {source: 'postgres-1', target: 'localdb'}, flags: {}})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pulling postgres-1 ---> localdb\nheroku-cli: Pulling complete.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => psql.exec.restore())
    }))

    it('opens an SSH tunnel and runs pg_dump for bastion databases', sinon.test(() => {
      db.bastionHost = 'bastion-host'
      db.bastionKey = 'super-private-key'

      let tunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'herokai.com',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152
      }

      let psql = require('../../lib/psql')
      sinon.stub(psql, 'exec')
      let cp = sinon.mock(require('child_process'))
      cp.expects('execSync').withExactArgs('createdb     localdb', {stdio: 'inherit'}).once()

      let cmd = 'env PGPASSWORD="pass" PGSSLMODE=prefer pg_dump --verbose -F c -Z 0  -U jeff -h herokai.com -p 5432  mydb | env pg_restore --verbose --no-acl --no-owner    -d localdb'
      cp.expects('spawn').withExactArgs(cmd, [], opts).once().returns(
        {
          stdout: {
            on: stdoutHandler
          },
          on: exitHandler
        }
      )

      return pull.run({args: {source: 'postgres-1', target: 'localdb'}, flags: {}})
      .then(() => cp.verify())
      .then(() => expect(cli.stdout, 'to equal', 'heroku-cli: Pulling postgres-1 ---> localdb\nheroku-cli: Pulling complete.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => expect(
        tunnelStub.withArgs(tunnelConf).calledOnce, 'to equal', true)
      )
      .then(() => psql.exec.restore())
    }))
  })
})
