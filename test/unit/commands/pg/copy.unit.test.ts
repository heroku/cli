import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {TransferFailedError} from '@heroku/sdk/extensions/data'
import ansis from 'ansis'
import {expect} from 'chai'
import {
  createSandbox,
  SinonStub,
} from 'sinon'

import Cmd from '../../../../src/commands/pg/copy.js'
import ConfirmCommand from '../../../../src/lib/confirm-command.js'

const sourceEndpoint = {
  confirm: 'bar',
  name: 'database bar on foo.com:5432',
}
type SourceEndpoint = typeof sourceEndpoint & {database?: {addon: {name: string}}}
const targetEndpoint = {
  confirm: 'RED',
  name: 'RED',
}
const transfer = {
  created_at: '2026-01-01 00:00:00 +0000',
  from_type: 'pg_dump' as const,
  logs: [{created_at: '2026-01-01 00:00:01 +0000', level: 'info' as const, message: 'copy started'}],
  num: 1,
  num_keep: 0,
  processed_bytes: 100,
  to_type: 'pg_restore' as const,
  uuid: '100-001',
  warnings: 0,
}
type Transfer = typeof transfer

interface CopyOptions {
  beforeCopy?: (preview: {source: SourceEndpoint; target: typeof targetEndpoint}) => Promise<void> | void
  copyPoller?: {onStart?: (preview: {source: typeof sourceEndpoint; target: typeof targetEndpoint}) => void; onStop?: () => void}
  credentialToken?: string
  intervalMs?: number
  onCredentialsChecked?: (result: {credentialCount?: number; hasAdditionalCredentials: boolean; warning?: string}) => void
  onPoll?: (transfer: Transfer | undefined) => void
  verbose?: boolean
  waitPoller?: {onStart?: (transfer: Transfer) => void; onStop?: (transfer: Transfer) => void}
}

interface FakeData {
  database: {copyForApp: SinonStub}
}

const copyWith = (
  copyResult: Record<string, unknown>,
  overrides: {source?: SourceEndpoint; target?: typeof targetEndpoint} = {},
) => async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
  const preview = {source: overrides.source ?? sourceEndpoint, target: overrides.target ?? targetEndpoint}
  await options.beforeCopy?.(preview)
  options.onCredentialsChecked?.({credentialCount: 1, hasAdditionalCredentials: false})
  options.copyPoller?.onStart?.(preview)
  options.waitPoller?.onStart?.(transfer)
  options.copyPoller?.onStop?.()
  options.onPoll?.(transfer)
  options.waitPoller?.onStop?.(transfer)
  await Promise.resolve()
  return copyResult
}

const originalDataGetter = Object.getOwnPropertyDescriptor(HerokuSDK.prototype, 'data')!.get!

describe('pg:copy', function () {
  let fakeData: FakeData
  let sandbox: ReturnType<typeof createSandbox>
  let dataGetterCalls: number

  beforeEach(function () {
    sandbox = createSandbox()
    fakeData = {database: {copyForApp: sandbox.stub()}}
    dataGetterCalls = 0
    sandbox.stub(HerokuSDK.prototype, 'data').get(function (this: HerokuSDK) {
      dataGetterCalls += 1
      return dataGetterCalls === 1 ? fakeData as never : originalDataGetter.call(this)
    })
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('passes raw URL and attachment inputs through to database.copyForApp and preserves output', async function () {
    const copyResult = {
      credentialCount: undefined, hasAdditionalCredentials: false, source: sourceEndpoint, target: targetEndpoint, transfer, warnings: [],
    }
    fakeData.database.copyForApp.callsFake(copyWith(copyResult))

    const {error, result, stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'postgres://foo.com/bar', 'HEROKU_POSTGRESQL_RED_URL',
    ])

    expect(error).to.be.undefined
    expect(fakeData.database.copyForApp.calledOnce).to.equal(true)
    expect(fakeData.database.copyForApp.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', 'postgres://foo.com/bar', 'HEROKU_POSTGRESQL_RED_URL'])
    expect(dataGetterCalls).to.equal(1)
    expect(result).to.equal(copyResult)
    expect(stdout).to.equal('')
    expect(stderr).to.include('Starting copy of database bar on foo.com:5432 to RED... done\n')
    expect(stderr).to.include('Copying... done')
  })

  it('uses the raw external target URL identity for confirmation', async function () {
    const externalTarget = {confirm: 'target', name: 'database target on target.example:5432'}
    const confirm = sandbox.stub(ConfirmCommand.prototype, 'confirm').resolves()
    fakeData.database.copyForApp.callsFake(copyWith({
      source: sourceEndpoint, target: externalTarget, transfer, warnings: [],
    }, {target: externalTarget}))

    const {error} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'target', 'HEROKU_POSTGRESQL_RED_URL', 'postgres://target.example/target',
    ])

    expect(error).to.be.undefined
    expect(fakeData.database.copyForApp.calledOnce).to.equal(true)
    expect(confirm.firstCall.args[0]).to.equal('target')
    expect(confirm.firstCall.args[1]).to.equal('target')
  })

  it('preserves cross-app attachment references without rewriting source inputs', async function () {
    const crossAppTarget = {confirm: 'BLUE', name: 'BLUE'}
    fakeData.database.copyForApp.callsFake(copyWith({transfer, warnings: []}, {target: crossAppTarget}))

    const {error} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'BLUE', 'HEROKU_POSTGRESQL_RED_URL', 'myotherapp::DATABASE_URL',
    ])

    expect(error).to.be.undefined
    expect(fakeData.database.copyForApp.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', 'HEROKU_POSTGRESQL_RED_URL', 'myotherapp::DATABASE_URL'])
  })

  it('rejects an incorrect external target confirmation before transfer', async function () {
    fakeData.database.copyForApp.callsFake(copyWith({transfer}, {target: {confirm: 'target', name: 'database target on target.example:5432'}}))

    const {error} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'target.example', 'HEROKU_POSTGRESQL_RED_URL', 'postgres://target.example/target',
    ])

    expect(error?.message).to.include('Confirmation')
    expect(error?.message).to.include('did not match')
  })

  it('warns for additional credentials and reports SDK credential lookup warnings after successful polling', async function () {
    const callbackError = new Error('credential query unavailable')
    const copyResult = {
      credentialCount: undefined,
      hasAdditionalCredentials: false,
      source: sourceEndpoint,
      target: targetEndpoint,
      transfer,
      warnings: [`source credential lookup failed: ${callbackError.message}`],
    }
    fakeData.database.copyForApp.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceEndpoint, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.onCredentialsChecked?.({credentialCount: 2, hasAdditionalCredentials: true})
      options.copyPoller?.onStart?.(preview)
      options.waitPoller?.onStart?.(transfer)
      options.copyPoller?.onStop?.()
      options.onPoll?.(transfer)
      options.waitPoller?.onStop?.(transfer)
      await Promise.resolve()
      return copyResult
    })

    const {error, result, stderr} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL'])

    expect(error).to.be.undefined
    expect(result).to.equal(copyResult)
    const normalizedOutput = stderr.replaceAll(/\n\s*[›»]?\s*/g, ' ').replaceAll(/\s+/g, ' ')
    expect(normalizedOutput).to.include('Warning: pg:copy will only copy your default credential')
    expect(normalizedOutput).to.include('Warning: source credential lookup failed: credential query unavailable')
    expect(stderr.indexOf('done')).to.be.lessThan(stderr.indexOf('source credential lookup failed'))
    expect(stderr).to.include('Copying...')
    expect(stderr).to.include('Copying... done')
  })

  it('uses the SDK credential callback before transfer and constructs one data client', async function () {
    const sourceWithDatabase: SourceEndpoint = {...sourceEndpoint, database: {addon: {name: 'source-addon'}}}
    const copyResult = {
      source: sourceWithDatabase,
      target: targetEndpoint,
      transfer,
      warnings: [],
    }
    const sequence: string[] = []
    const credentialLookup = sandbox.stub(HerokuApiClient.prototype, 'get')
    sandbox.stub(ConfirmCommand.prototype, 'confirm').callsFake(async () => {
      sequence.push('confirmed')
    })
    fakeData.database.copyForApp.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceWithDatabase, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.onCredentialsChecked?.({credentialCount: 2, hasAdditionalCredentials: true})
      sequence.push('credentials checked', 'transfer')
      options.copyPoller?.onStart?.(preview)
      options.waitPoller?.onStart?.(transfer)
      options.copyPoller?.onStop?.()
      options.waitPoller?.onStop?.(transfer)
      return copyResult
    })

    const {error, result, stderr} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL'])

    expect(error).to.be.undefined
    expect(result).to.equal(copyResult)
    expect(fakeData.database.copyForApp.calledOnce).to.equal(true)
    expect(dataGetterCalls).to.equal(1)
    expect(credentialLookup.called).to.equal(false)
    expect(sequence).to.deep.equal(['confirmed', 'credentials checked', 'transfer'])
    expect(stderr.indexOf('only copy your default credential')).to.be.lessThan(stderr.indexOf('Starting copy'))
    expect(stderr.match(/only copy your default credential/g)).to.have.length(1)
  })

  it('passes CLI credentials to the data-service lookup through the bound SDK resource method', async function () {
    sandbox.stub(APIClient.prototype, 'auth').get(() => 'credential-token')
    // `this` is part of the call contract being exercised here.
    // eslint-disable-next-line max-params
    fakeData.database.copyForApp.callsFake(async function (this: FakeData['database'], _app: string, _source: string, _target: string, options: CopyOptions = {}) {
      expect(this).to.equal(fakeData.database)
      expect(options.credentialToken).to.equal('credential-token')
      return copyWith({transfer, warnings: []})('myapp', 'DATABASE_URL', 'RED_URL', options)
    })

    const {error} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL'])

    expect(error).to.be.undefined
    expect(fakeData.database.copyForApp.calledOnce).to.equal(true)
  })

  it('shows sanitized SDK credential lookup warnings before transfer without duplication', async function () {
    const sourceWithDatabase: SourceEndpoint = {...sourceEndpoint, database: {addon: {name: 'source-addon'}}}
    const warning = 'source credential lookup failed: credential service unavailable for postgres://[REDACTED]'
    const copyResult = {
      source: sourceWithDatabase,
      target: targetEndpoint,
      transfer,
      warnings: [warning],
    }
    const sequence: string[] = []
    fakeData.database.copyForApp.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceWithDatabase, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.onCredentialsChecked?.({hasAdditionalCredentials: false, warning})
      sequence.push('credentials checked', 'transfer')
      options.copyPoller?.onStart?.(preview)
      options.waitPoller?.onStart?.(transfer)
      options.copyPoller?.onStop?.()
      options.waitPoller?.onStop?.(transfer)
      return copyResult
    })

    const {error, result, stderr} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL'])

    expect(error).to.be.undefined
    expect(result).to.equal(copyResult)
    expect(sequence).to.deep.equal(['credentials checked', 'transfer'])
    expect(stderr.match(/source credential lookup failed/g)).to.have.length(1)
    expect(stderr.indexOf('source credential lookup failed')).to.be.lessThan(stderr.indexOf('Starting copy'))
    expect(stderr).not.to.include('source-addon')
  })

  it('passes verbose and polling progress options to database.copyForApp', async function () {
    fakeData.database.copyForApp.callsFake(copyWith({transfer, warnings: []}))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', '--verbose', '--wait-interval', '5', 'DATABASE_URL', 'RED_URL',
    ])

    const options = fakeData.database.copyForApp.firstCall.args[3] as CopyOptions
    expect(options.verbose).to.equal(true)
    expect(options.intervalMs).to.equal(5000)
    expect(options.onPoll).to.be.a('function')
    expect(options.copyPoller?.onStart).to.be.a('function')
    expect(options.waitPoller?.onStart).to.be.a('function')
    expect(stdout).to.include('copy started')
    expect(stdout).to.include('Copying...')
    expect(stderr).to.include('Starting copy of database bar on foo.com:5432 to RED... done\n')
  })

  it('reports copy failures and does not repeat ancillary warnings already shown', async function () {
    const failedTransfer = {...transfer, logs: [{...transfer.logs[0]!, message: 'copy failed'}]}
    const warning = 'source credential lookup failed'
    const additionalWarning = 'target credential lookup failed'
    const failure = new TransferFailedError(failedTransfer)
    failure.ancillaryErrors = [warning, additionalWarning]
    fakeData.database.copyForApp.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceEndpoint, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.onCredentialsChecked?.({hasAdditionalCredentials: false, warning})
      options.copyPoller?.onStart?.(preview)
      throw failure
    })

    const {error, stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL',
    ])

    expect(ansis.strip(error!.message)).to.contain('An error occurred and the copy did not finish.')
    expect(ansis.strip(error!.message)).not.to.contain('backup did not finish')
    expect(ansis.strip(error!.message)).to.contain('copy failed')
    expect(ansis.strip(error!.message)).to.contain('Run heroku pg:backups:info c001 for more details.')
    expect(stdout).to.equal('')
    expect(stderr).to.include('!\n')
    expect(stderr.match(/source credential lookup failed/g)).to.have.length(1)
    expect(stderr.match(/target credential lookup failed/g)).to.have.length(1)
  })

  it('stops the copy spinner when transfer creation fails', async function () {
    const error = new Error('transfer create failed')
    fakeData.database.copyForApp.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceEndpoint, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.copyPoller?.onStart?.(preview)
      throw error
    })

    const {error: commandError, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL',
    ])

    expect(commandError).to.equal(error)
    expect(stderr).to.contain('Starting copy of database bar on foo.com:5432 to RED... !')
  })

  it('stops the polling spinner when transfer observation fails', async function () {
    const error = new Error('transfer observation failed')
    fakeData.database.copyForApp.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceEndpoint, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.copyPoller?.onStart?.(preview)
      options.waitPoller?.onStart?.(transfer)
      options.copyPoller?.onStop?.()
      throw error
    })

    const {error: commandError, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL',
    ])

    expect(commandError).to.equal(error)
    expect(stderr).to.contain('Copying... !')
  })

  it('renders failed transfer logs once in verbose mode', async function () {
    const failedTransfer = {...transfer, logs: [{...transfer.logs[0]!, message: 'copy failed'}]}
    fakeData.database.copyForApp.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceEndpoint, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.copyPoller?.onStart?.(preview)
      options.waitPoller?.onStart?.(transfer)
      options.copyPoller?.onStop?.()
      options.onPoll?.(failedTransfer)
      throw new TransferFailedError(failedTransfer)
    })

    const {error, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', '--verbose', 'DATABASE_URL', 'RED_URL',
    ])

    expect(error).to.not.be.undefined
    expect(stdout.match(/copy failed/g)).to.have.length(1)
  })
})
