/* eslint-disable @typescript-eslint/ban-ts-comment */
import {APIClient} from '@heroku-cli/command'
import {pg} from '@heroku/heroku-cli-util'
import {CLIError} from '@oclif/core/errors'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import {runPsqlThroughOneOffDyno} from '../../../../src/lib/pg/one-off-dyno.js'
import Dyno, {DynoOpts} from '../../../../src/lib/run/dyno.js'

const heroku = {} as APIClient

const db = {
  attachment: {
    addon: {name: 'postgres-1', plan: {name: 'heroku-postgresql:shield-0'}},
    app: {name: 'myapp'},
    config_vars: ['DATABASE_URL'],
    name: 'DATABASE',
  },
  database: 'mydb',
  host: 'localhost',
  password: 'pass',
  port: 5432,
  user: 'jeff',
} as unknown as pg.ConnectionDetails

describe('runPsqlThroughOneOffDyno', function () {
  let capturedOpts: DynoOpts | undefined

  beforeEach(function () {
    capturedOpts = undefined
  })

  afterEach(function () {
    restore()
  })

  it('builds a non-interactive psql shell command with --command', async function () {
    stub(Dyno.prototype, 'start').callsFake(function () {
      // @ts-ignore
      capturedOpts = this.opts
      return Promise.resolve()
    })

    await runPsqlThroughOneOffDyno({command: 'SELECT 1', db, heroku})

    expect(capturedOpts?.command).to.equal('psql -c "SELECT 1" --set sslmode=require --set channel_binding=require $DATABASE_URL')
    expect(capturedOpts?.env).to.equal("PGAPPNAME='psql non-interactive';PGSSLMODE=require;PGCHANNELBINDING=require")
    expect(capturedOpts?.app).to.equal('myapp')
    expect(capturedOpts?.attach).to.be.true
    expect(capturedOpts?.['exit-code']).to.be.true
  })

  it('builds an interactive psql shell command with a PROMPT', async function () {
    stub(Dyno.prototype, 'start').callsFake(function () {
      // @ts-ignore
      capturedOpts = this.opts
      return Promise.resolve()
    })

    await runPsqlThroughOneOffDyno({db, heroku})

    expect(capturedOpts?.command).to.equal('psql --set PROMPT1="myapp::DATABASE%R%# " --set PROMPT2="myapp::DATABASE%R%# " --set sslmode=require --set channel_binding=require $DATABASE_URL')
    expect(capturedOpts?.env).to.equal("PGAPPNAME='psql interactive';PGSSLMODE=require;PGCHANNELBINDING=require")
  })

  it('escapes embedded double quotes in --command', async function () {
    stub(Dyno.prototype, 'start').callsFake(function () {
      // @ts-ignore
      capturedOpts = this.opts
      return Promise.resolve()
    })

    await runPsqlThroughOneOffDyno({command: 'SELECT "col"', db, heroku})

    expect(capturedOpts?.command).to.equal(String.raw`psql -c "SELECT \"col\"" --set sslmode=require --set channel_binding=require $DATABASE_URL`)
  })

  it('honors --channel-binding=disable in both command and env', async function () {
    stub(Dyno.prototype, 'start').callsFake(function () {
      // @ts-ignore
      capturedOpts = this.opts
      return Promise.resolve()
    })

    await runPsqlThroughOneOffDyno({
      channelBinding: 'disable', command: 'SELECT 1', db, heroku,
    })

    expect(capturedOpts?.command).to.contain('--set channel_binding=disable')
    expect(capturedOpts?.env).to.contain('PGCHANNELBINDING=disable')
  })

  it('passes through notificationSubtitle', async function () {
    stub(Dyno.prototype, 'start').callsFake(function () {
      // @ts-ignore
      capturedOpts = this.opts
      return Promise.resolve()
    })

    await runPsqlThroughOneOffDyno({db, heroku, notificationSubtitle: 'heroku pg:psql'})

    expect(capturedOpts?.notificationSubtitle).to.equal('heroku pg:psql')
  })

  it('errors out when --file is provided', async function () {
    const startStub = stub(Dyno.prototype, 'start').resolves()

    let error: unknown
    try {
      await runPsqlThroughOneOffDyno({db, file: 'test.sql', heroku})
    } catch (error_) {
      error = error_
    }

    const {message, oclif} = error as CLIError
    expect(message).to.eq("You can't use the --file flag on private networked databases.")
    expect(oclif.exit).to.eq(1)
    expect(startStub.called).to.be.false
  })

  it('rethrows Dyno errors carrying an exitCode as CLIError with that code', async function () {
    stub(Dyno.prototype, 'start').callsFake(function () {
      const err = new Error('dyno went boom') as Error & {exitCode?: number}
      err.exitCode = 7
      throw err
    })

    let error: unknown
    try {
      await runPsqlThroughOneOffDyno({command: 'SELECT 1', db, heroku})
    } catch (error_) {
      error = error_
    }

    const {message, oclif} = error as CLIError
    expect(message).to.eq('dyno went boom')
    expect(oclif.exit).to.eq(7)
  })

  it('rethrows Dyno errors without an exitCode as-is', async function () {
    stub(Dyno.prototype, 'start').callsFake(function () {
      throw new Error('unclassified failure')
    })

    let error: unknown
    try {
      await runPsqlThroughOneOffDyno({command: 'SELECT 1', db, heroku})
    } catch (error_) {
      error = error_
    }

    expect((error as Error).message).to.eq('unclassified failure')
    expect((error as CLIError).oclif).to.be.undefined
  })
})
