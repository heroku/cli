import {runCommand} from '@heroku-cli/test-utils'
import {EssentialDatabaseNotSupportedError, InvalidLinkRemoteError} from '@heroku/sdk/extensions/data'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/create.js'
import {MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type Addon = {id: string; name: string; plan: {name: string}}

const db: Addon = {id: 'db-1', name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'}}
const redis: Addon = {id: 'r1', name: 'redis-1', plan: {name: 'heroku-redis:premium-0'}}

/** Fakes `createForDatabase`, running `beforeCreate` the way the SDK does before the create. */
function fakeCreate(target: Addon, linkName: string) {
  return sinon.stub().callsFake(async (...args) => {
    const opts = args[4]
    await opts?.beforeCreate?.({addon: db, target})
    return {addon: db, link: {name: linkName}, target}
  })
}

describe('pg:links:create', function () {
  let createForDatabase: sinon.SinonStub
  let sdkMock: MockSDK

  function stubSDK(stub: sinon.SinonStub) {
    createForDatabase = stub
    sdkMock = mockSDKData({link: {createForDatabase}})
  }

  afterEach(function () {
    sdkMock.restore()
  })

  describe('on an essential database', function () {
    it('errors when attempting to create a link', async function () {
      stubSDK(sinon.stub().rejects(new EssentialDatabaseNotSupportedError(db as never, 'essential')))

      const {error} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'foobar',
        'heroku-redis',
        'heroku-postgres',
      ])
      expect(error?.message).to.equal('pg:links isn\'t available for Essential-tier databases.')
    })
  })

  describe('on a production database', function () {
    it('errors when attempting to create a link', async function () {
      stubSDK(fakeCreate(db, 'foobar'))

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'foobar',
        'heroku-redis',
        'heroku-postgres',
      ])
      expect(stdout).to.equal('')
      expect(stderr).to.equal(heredoc(`
      Adding link from ⛁ postgres-1 to ⛁ postgres-1... done, foobar
      `))
      expect(createForDatabase.calledOnce).to.equal(true)
      expect(createForDatabase.firstCall.args.slice(0, 4)).to.deep.equal(['myapp', 'heroku-postgres', 'heroku-redis', {as: 'foobar'}])
    })
  })

  describe('remote resolution and validation', function () {
    it('creates a link without --as', async function () {
      stubSDK(fakeCreate(redis, 'generated-link'))

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'redis-1', 'DATABASE_URL'])

      expect(stdout).to.equal('')
      expect(stderr).to.equal('Adding link from ⛁ redis-1 to ⛁ postgres-1... done, generated-link\n')
      expect(createForDatabase.firstCall.args.slice(0, 4)).to.deep.equal(['myapp', 'DATABASE_URL', 'redis-1', {as: undefined}])
    })

    it('links a remote owned by another app', async function () {
      const remote = {id: 'r2', name: 'redis-other', plan: {name: 'heroku-redis:premium-0'}}
      stubSDK(fakeCreate(remote, 'cross'))

      const {stderr} = await runCommand(Cmd, ['--app', 'myapp', '--as', 'cross', 'redis-other', 'DATABASE_URL'])

      expect(stderr).to.equal('Adding link from ⛁ redis-other to ⛁ postgres-1... done, cross\n')
    })

    it('errors when the remote is not a Heroku Postgres or Key-Value Store add-on', async function () {
      const papertrail = {id: 'p1', name: 'papertrail-1', plan: {name: 'papertrail:basic'}}
      stubSDK(sinon.stub().rejects(new InvalidLinkRemoteError(papertrail as never)))

      const {error} = await runCommand(Cmd, ['--app', 'myapp', 'papertrail-1', 'DATABASE_URL'])

      expect(error?.message).to.equal('Remote database must be heroku-redis or heroku-postgresql')
    })

    it('errors when the remote is an Essential-tier database', async function () {
      const essentialRemote = {id: 'e1', name: 'postgres-essential', plan: {name: 'heroku-postgresql:essential-0'}}
      stubSDK(sinon.stub().rejects(new EssentialDatabaseNotSupportedError(essentialRemote as never, 'essential')))

      const {error} = await runCommand(Cmd, ['--app', 'myapp', 'postgres-essential', 'DATABASE_URL'])

      expect(error?.message).to.equal('pg:links isn\'t available for Essential-tier databases.')
    })

    it('stops the spinner with a failure marker and rethrows when the create fails', async function () {
      stubSDK(sinon.stub().callsFake(async (...args) => {
        const opts = args[4]
        await opts?.beforeCreate?.({addon: db, target: redis})
        throw new Error('link create failed')
      }))

      const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'redis-1', 'DATABASE_URL'])

      expect(error?.message).to.equal('link create failed')
      expect(stderr).to.contain('Adding link from ⛁ redis-1 to ⛁ postgres-1... !')
    })
  })
})
