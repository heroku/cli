/* eslint-disable @typescript-eslint/ban-ts-comment */
import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {CLIError} from '@oclif/core/errors'
import {expect} from 'chai'
import {restore, SinonSpy, stub} from 'sinon'

import type {DynoOpts} from '../../../../src/lib/run/dyno.js'

import Cmd from '../../../../src/commands/pg/psql.js'
import Dyno from '../../../../src/lib/run/dyno.js'

const db = {
  attachment: {
    addon: {
      name: 'postgres-1',
      plan: {name: 'heroku-postgresql:essential-1'},
    },
    app: {name: 'myapp'},
    config_vars: ['DATABASE_URL'],
  },
  database: 'mydb',
  host: 'localhost',
  password: 'pass',
  pathname: '/corn',
  port: '5432',
  url: 'postgres://jeff:pass@localhost:5432/corn',
  user: 'jeff',
} as unknown as pg.ConnectionDetails

const makeDb = (planName: string) => ({
  attachment: {
    addon: {
      name: 'postgres-1',
      plan: {name: planName},
    },
    app: {name: 'myapp'},
    config_vars: ['DATABASE_URL'],
    name: 'DATABASE',
  },
  connStringVar: 'DATABASE_URL',
  database: 'mydb',
  host: 'localhost',
  password: 'pass',
  port: 5432,
  user: 'jeff',
} as unknown as pg.ConnectionDetails)

describe('psql', function () {
  describe('default tier', function () {
    beforeEach(function () {
      stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
      stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('')
      stub(utils.pg.PsqlService.prototype, 'execFile').resolves('')
    })

    afterEach(function () {
      restore()
    })

    it('runs psql', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--command',
        'SELECT 1',
      ])
      expect(stdout).to.equal('')
      expect(stderr).to.equal('--> Connecting to ⛁ postgres-1\n')
    })

    it('runs psql with file', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--file',
        'test.sql',
      ])
      expect(stdout).to.equal('')
      expect(stderr).to.equal('--> Connecting to ⛁ postgres-1\n')
    })
  })

  describe('private-network tiers', function () {
    let psqlExecQueryStub: SinonSpy
    let psqlExecFileStub: SinonSpy
    let dynoStartStub: SinonSpy
    let capturedDynoOpts: DynoOpts | undefined

    afterEach(function () {
      restore()
      capturedDynoOpts = undefined
    })

    const installStubs = (planName: string) => {
      stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(makeDb(planName))
      psqlExecQueryStub = stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('')
      psqlExecFileStub = stub(utils.pg.PsqlService.prototype, 'execFile').resolves('')
      stub(utils.pg.PsqlService.prototype, 'interactiveSession').resolves('')
      dynoStartStub = stub(Dyno.prototype, 'start').callsFake(function () {
        // @ts-ignore
        capturedDynoOpts = this.opts
        return Promise.resolve()
      })
    }

    describe('advanced-private tier', function () {
      beforeEach(function () {
        installStubs('heroku-postgresql:advanced-private')
      })

      it('runs psql through a one-off dyno with --command', async function () {
        const {stdout} = await runCommand(Cmd, [
          '--app',
          'myapp',
          '--command',
          'SELECT 1',
        ])

        expect(stdout).to.equal('')
        expect(dynoStartStub.calledOnce).to.be.true
        expect(psqlExecQueryStub.called).to.be.false
        expect(capturedDynoOpts).to.include({
          app: 'myapp',
          attach: true,
          command: 'psql -c "SELECT 1" --set sslmode=require --set channel_binding=require $DATABASE_URL',
          env: "PGAPPNAME='psql non-interactive';PGSSLMODE=require;PGCHANNELBINDING=require",
          'exit-code': true,
          notificationSubtitle: 'heroku pg:psql',
        })
      })

      it('runs an interactive psql session through a one-off dyno', async function () {
        await runCommand(Cmd, [
          '--app',
          'myapp',
        ])

        expect(dynoStartStub.calledOnce).to.be.true
        expect(capturedDynoOpts).to.include({
          command: 'psql --set PROMPT1="myapp::DATABASE%R%# " --set PROMPT2="myapp::DATABASE%R%# " --set sslmode=require --set channel_binding=require $DATABASE_URL',
          env: "PGAPPNAME='psql interactive';PGSSLMODE=require;PGCHANNELBINDING=require",
        })
      })

      it("errors out with '--file' option", async function () {
        const {error} = await runCommand(Cmd, [
          '--app',
          'myapp',
          '--file',
          'test.sql',
        ])
        const {message, oclif} = error as CLIError
        expect(message).to.eq("You can't use the --file flag on private networked databases.")
        expect(oclif.exit).to.eq(1)
        expect(psqlExecFileStub.called).to.be.false
        expect(dynoStartStub.called).to.be.false
      })
    })

    describe('classic shield tier', function () {
      beforeEach(function () {
        installStubs('heroku-postgresql:shield-0')
      })

      it('runs psql through a one-off dyno with --command', async function () {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--command',
          'SELECT 1',
        ])

        expect(dynoStartStub.calledOnce).to.be.true
        expect(psqlExecQueryStub.called).to.be.false
        expect(capturedDynoOpts).to.include({
          command: 'psql -c "SELECT 1" --set sslmode=require --set channel_binding=require $DATABASE_URL',
        })
      })

      it('runs an interactive psql session through a one-off dyno', async function () {
        await runCommand(Cmd, [
          '--app',
          'myapp',
        ])

        expect(dynoStartStub.calledOnce).to.be.true
        expect(capturedDynoOpts).to.include({
          command: 'psql --set PROMPT1="myapp::DATABASE%R%# " --set PROMPT2="myapp::DATABASE%R%# " --set sslmode=require --set channel_binding=require $DATABASE_URL',
        })
      })

      it("errors out with '--file' option", async function () {
        const {error} = await runCommand(Cmd, [
          '--app',
          'myapp',
          '--file',
          'test.sql',
        ])
        const {message, oclif} = error as CLIError
        expect(message).to.eq("You can't use the --file flag on private networked databases.")
        expect(oclif.exit).to.eq(1)
        expect(psqlExecFileStub.called).to.be.false
        expect(dynoStartStub.called).to.be.false
      })
    })

    describe('classic private tier (bastion)', function () {
      beforeEach(function () {
        installStubs('heroku-postgresql:private-0')
      })

      it('connects through the bastion PsqlService, not a one-off dyno', async function () {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--command',
          'SELECT 1',
        ])

        expect(psqlExecQueryStub.calledOnce).to.be.true
        expect(dynoStartStub.called).to.be.false
      })

      it('allows the --file flag (streamed locally through the tunnel)', async function () {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--file',
          'test.sql',
        ])

        expect(psqlExecFileStub.calledOnce).to.be.true
        expect(dynoStartStub.called).to.be.false
      })
    })
  })
})
