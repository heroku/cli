import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {color} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {DatabaseNotFollowerError} from '@heroku/sdk/extensions/data'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/unfollow.js'
import ConfirmCommand from '../../../../src/lib/confirm-command.js'

const heredoc = tsheredoc

const addon = {
  app: {id: 'app-1', name: 'myapp'},
  id: 'addon-1',
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}

const unfollowResult = {
  addon,
  database: {following: 'postgres://db1'},
  following: 'postgres://db1',
  origin: {name: 'postgres-1', rawName: 'postgres-1_URL', type: 'config_var' as const},
  result: {message: 'unfollowed'},
}

interface UnfollowPreview {
  addon: typeof addon
  following: string
  origin: {defaultPort: string, hostname: string, pathname: string, port: string, protocol: string, type: 'url'} | {name: string; rawName: string; type: 'config_var'}
}

interface UnfollowOptions {
  beforeUnfollow?: (preview: UnfollowPreview) => Promise<void> | void
}

interface FakeData {
  database: {unfollowForApp: SinonStub}
}

const unfollowWith = (result: unknown, onUnfollow = () => {}, preview?: UnfollowPreview) => async (_app: string, _database?: string, options: UnfollowOptions = {}) => {
  await options.beforeUnfollow?.(preview ?? {
    addon,
    following: 'postgres://db1',
    origin: {name: 'postgres-1', rawName: 'postgres-1_URL', type: 'config_var'},
  })
  onUnfollow()

  return result
}

describe('pg:unfollow', function () {
  let fakeData: FakeData
  let unfollowRequested: boolean

  beforeEach(function () {
    unfollowRequested = false
    fakeData = {database: {unfollowForApp: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(function () {
    restore()
  })

  it('unfollows the database and returns the SDK result', async function () {
    fakeData.database.unfollowForApp.callsFake(unfollowWith(unfollowResult, () => {
      unfollowRequested = true
    }))

    const {result, stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'myapp', 'DATABASE',
    ])

    expect(fakeData.database.unfollowForApp.calledOnce).to.equal(true)
    expect(fakeData.database.unfollowForApp.firstCall.args[0]).to.equal('myapp')
    expect(fakeData.database.unfollowForApp.firstCall.args[1]).to.equal('DATABASE')
    expect(unfollowRequested).to.equal(true)
    expect(result).to.deep.equal(unfollowResult)
    expect(stdout).to.equal('')
    expectOutput(stderr, 'postgres-1 unfollowing... done')
  })

  it('passes the database identity to the SDK', async function () {
    fakeData.database.unfollowForApp.callsFake(unfollowWith(unfollowResult))

    const {result, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '-c', 'myapp', 'DATABASE_URL',
    ])

    expect(fakeData.database.unfollowForApp.calledOnce).to.equal(true)
    expect(fakeData.database.unfollowForApp.firstCall.args[0]).to.equal('myapp')
    expect(fakeData.database.unfollowForApp.firstCall.args[1]).to.equal('DATABASE_URL')
    expect(result).to.deep.equal(unfollowResult)
    expectOutput(stderr, 'postgres-1 unfollowing... done')
  })

  it('does not unfollow when confirmation does not match the app', async function () {
    fakeData.database.unfollowForApp.callsFake(unfollowWith(unfollowResult, () => {
      unfollowRequested = true
    }))

    const {error, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'another-app', 'DATABASE',
    ])

    expect(ansis.strip((error as Error).message)).to.contain('Confirmation another-app did not match myapp. Aborted.')
    expect(fakeData.database.unfollowForApp.calledOnce).to.equal(true)
    expect(fakeData.database.unfollowForApp.firstCall.args[2].beforeUnfollow).to.be.a('function')
    expect(unfollowRequested).to.equal(false)
    expect(stderr).to.equal('')
  })

  it('preserves the destructive-action confirmation message', async function () {
    fakeData.database.unfollowForApp.callsFake(unfollowWith(unfollowResult))
    const confirm = stub(ConfirmCommand.prototype, 'confirm').resolves()

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'DATABASE'])

    expect(confirm.calledOnce).to.equal(true)
    expect(confirm.firstCall.args[0]).to.equal('myapp')
    expect(confirm.firstCall.args[1]).to.be.undefined
    expect(ansis.strip(confirm.firstCall.args[2] as string)).to.equal(heredoc(`
      Destructive action
      postgres-1 will become writeable and no longer follow postgres-1. This cannot be undone.
    `))
    expect(stderr).to.contain('postgres-1 unfollowing... done')
  })

  it('colors an origin config-var name in the confirmation', async function () {
    fakeData.database.unfollowForApp.callsFake(unfollowWith(unfollowResult, () => {}, {
      addon,
      following: 'postgres://db1:5432/database',
      origin: {name: 'FOLLOWING', rawName: 'FOLLOWING_URL', type: 'config_var'},
    }))
    const confirm = stub(ConfirmCommand.prototype, 'confirm').resolves()

    await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'myapp', 'DATABASE'])

    expect(confirm.firstCall.args[2]).to.contain(color.name('FOLLOWING'))
    expect(ansis.strip(confirm.firstCall.args[2] as string)).not.to.contain('FOLLOWING_URL')
  })

  it('uses PGPORT when formatting an origin URL without an explicit port', async function () {
    const previousPgPort = process.env.PGPORT
    process.env.PGPORT = '6432'
    fakeData.database.unfollowForApp.callsFake(unfollowWith(unfollowResult, () => {}, {
      addon,
      following: 'postgres://db1/database',
      origin: {
        defaultPort: '5432', hostname: 'db1', pathname: '/database', port: '', protocol: 'postgres:', type: 'url',
      },
    }))
    const confirm = stub(ConfirmCommand.prototype, 'confirm').resolves()

    try {
      await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'myapp', 'DATABASE'])
      expect(confirm.firstCall.args[2]).to.contain('db1:6432/database')
    } finally {
      if (previousPgPort === undefined) delete process.env.PGPORT
      else process.env.PGPORT = previousPgPort
    }
  })

  it('uses an explicit URL port instead of local PGPORT', async function () {
    const previousPgPort = process.env.PGPORT
    process.env.PGPORT = '6432'
    fakeData.database.unfollowForApp.callsFake(unfollowWith(unfollowResult, () => {}, {
      addon,
      following: 'postgres://db1:6543/database',
      origin: {
        defaultPort: '5432', hostname: 'db1', pathname: '/database', port: '6543', protocol: 'postgres:', type: 'url',
      },
    }))
    const confirm = stub(ConfirmCommand.prototype, 'confirm').resolves()

    try {
      await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'myapp', 'DATABASE'])
      expect(ansis.strip(confirm.firstCall.args[2] as string)).to.contain('db1:6543/database')
      expect(ansis.strip(confirm.firstCall.args[2] as string)).not.to.contain('db1:6432/database')
    } finally {
      if (previousPgPort === undefined) delete process.env.PGPORT
      else process.env.PGPORT = previousPgPort
    }
  })

  it('uses the SDK default port when URL and local PGPORT have no port', async function () {
    const previousPgPort = process.env.PGPORT
    delete process.env.PGPORT
    fakeData.database.unfollowForApp.callsFake(unfollowWith(unfollowResult, () => {}, {
      addon,
      following: 'postgres://db1/database',
      origin: {
        defaultPort: '5432', hostname: 'db2', pathname: '/database', port: '', protocol: 'postgres:', type: 'url',
      },
    }))
    const confirm = stub(ConfirmCommand.prototype, 'confirm').resolves()

    try {
      await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'myapp', 'DATABASE'])

      expect(ansis.strip(confirm.firstCall.args[2] as string)).to.contain('db2:5432/database')
      expect(ansis.strip(confirm.firstCall.args[2] as string)).to.not.contain('legacy-host')
    } finally {
      if (previousPgPort === undefined) delete process.env.PGPORT
      else process.env.PGPORT = previousPgPort
    }
  })

  it('preserves the colorized non-follower error', async function () {
    fakeData.database.unfollowForApp.rejects(new DatabaseNotFollowerError(addon))

    const {error, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'myapp', 'DATABASE',
    ])

    expect(ansis.strip((error as Error).message)).to.equal('postgres-1 is not a follower')
    expect(stderr).to.equal('')
  })

  it('does not complete the spinner when the SDK rejects', async function () {
    const error = new Error('unfollow failed')
    fakeData.database.unfollowForApp.callsFake(async (_app: string, _database: string | undefined, options: UnfollowOptions = {}) => {
      await options.beforeUnfollow?.({
        addon,
        following: 'postgres://db1',
        origin: {name: 'postgres-1', rawName: 'postgres-1_URL', type: 'config_var'},
      })
      throw error
    })

    const {error: commandError, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'myapp', 'DATABASE',
    ])

    expect(commandError).to.equal(error)
    expect(stderr).to.contain('postgres-1 unfollowing...')
    expect(stderr).to.not.contain('done')
  })
})
