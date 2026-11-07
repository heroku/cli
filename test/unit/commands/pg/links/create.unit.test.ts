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
const remotePg: Addon = {id: 'r1', name: 'postgres-2', plan: {name: 'heroku-postgresql:standard-0'}}

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
        'HEROKU_POSTGRESQL_BLUE',
        'heroku-postgres',
      ])
      expect(error?.message).to.equal('pg:links isn\'t available for Essential-tier databases.')
    })
  })

  describe('on a production database', function () {
    it('creates a link with --as', async function () {
      stubSDK(fakeCreate(remotePg, 'foobar'))

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'foobar',
        'HEROKU_POSTGRESQL_BLUE',
        'heroku-postgres',
      ])
      expect(stdout).to.equal('')
      expect(stderr).to.equal(heredoc(`
      Adding link from ⛁ postgres-2 to ⛁ postgres-1... done, foobar
      `))
      expect(createForDatabase.calledOnce).to.equal(true)
      expect(createForDatabase.firstCall.args.slice(0, 4)).to.deep.equal(['myapp', 'heroku-postgres', 'HEROKU_POSTGRESQL_BLUE', {as: 'foobar'}])
    })
  })

  describe('remote resolution and validation', function () {
    it('creates a link without --as', async function () {
      stubSDK(fakeCreate(remotePg, 'generated-link'))

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'postgres-2', 'DATABASE_URL'])

      expect(stdout).to.equal('')
      expect(stderr).to.equal('Adding link from ⛁ postgres-2 to ⛁ postgres-1... done, generated-link\n')
      expect(createForDatabase.firstCall.args.slice(0, 4)).to.deep.equal(['myapp', 'DATABASE_URL', 'postgres-2', {as: undefined}])
    })

    it('links a remote owned by another app', async function () {
      const remote = {id: 'r2', name: 'postgres-other', plan: {name: 'heroku-postgresql:standard-0'}}
      stubSDK(fakeCreate(remote, 'cross'))

      const {stderr} = await runCommand(Cmd, ['--app', 'myapp', '--as', 'cross', 'postgres-other', 'DATABASE_URL'])

      expect(stderr).to.equal('Adding link from ⛁ postgres-other to ⛁ postgres-1... done, cross\n')
    })

    it('errors when the remote is not a Heroku Postgres add-on', async function () {
      const papertrail = {id: 'p1', name: 'papertrail-1', plan: {name: 'papertrail:basic'}}
      const sdkError = new InvalidLinkRemoteError(papertrail as never)
      stubSDK(sinon.stub().rejects(sdkError))

      const {error} = await runCommand(Cmd, ['--app', 'myapp', 'papertrail-1', 'DATABASE_URL'])

      expect(error?.message).to.equal('papertrail-1 isn\'t a Heroku Postgres add-on, so it can\'t be linked. Data Links only connect Heroku Postgres databases.')
      expect(error).to.equal(sdkError)
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
        await opts?.beforeCreate?.({addon: db, target: remotePg})
        throw new Error('link create failed')
      }))

      const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', 'postgres-2', 'DATABASE_URL'])

      expect(error?.message).to.equal('link create failed')
      expect(stderr).to.contain('Adding link from ⛁ postgres-2 to ⛁ postgres-1... !')
    })
  })
})
