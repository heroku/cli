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

interface DataClientOptions {
  baseUrl?: string
  headers?: Record<string, string>
  service?: string
  signal?: AbortSignal
  token?: () => string
  userAgent?: {name: string; version: string}
}

interface CopyOptions {
  beforeCopy?: (preview: {source: SourceEndpoint; target: typeof targetEndpoint}) => Promise<void> | void
  copyPoller?: {onStart?: (preview: {source: typeof sourceEndpoint; target: typeof targetEndpoint}) => void; onStop?: () => void}
  credentialToken?: string
  intervalMs?: number
  onCredentialsChecked?: (result: {credentialCount?: number; hasAdditionalCredentials: boolean}) => void
  onPoll?: (transfer: Transfer | undefined) => void
  verbose?: boolean
  waitPoller?: {onStart?: (transfer: Transfer) => void; onStop?: (transfer: Transfer) => void}
}

interface FakeData {
  database: {copy: SinonStub}
}

const copyWith = (
  copyResult: Record<string, unknown>,
  overrides: {source?: SourceEndpoint; target?: typeof targetEndpoint} = {},
) => async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
  const preview = {source: overrides.source ?? sourceEndpoint, target: overrides.target ?? targetEndpoint}
  await options.beforeCopy?.(preview)
  options.copyPoller?.onStart?.(preview)
  options.waitPoller?.onStart?.(transfer)
  options.copyPoller?.onStop?.()
  options.onCredentialsChecked?.({credentialCount: 1, hasAdditionalCredentials: false})
  options.onPoll?.(transfer)
  options.waitPoller?.onStop?.(transfer)
  await Promise.resolve()
  return copyResult
}

const originalDataGetter = Object.getOwnPropertyDescriptor(HerokuSDK.prototype, 'data')!.get!

describe('pg:copy', function () {
  let fakeData: FakeData
  let sandbox: ReturnType<typeof createSandbox>

  beforeEach(function () {
    sandbox = createSandbox()
    fakeData = {database: {copy: sandbox.stub()}}
    let dataGetterCalls = 0
    sandbox.stub(HerokuSDK.prototype, 'data').get(function (this: HerokuSDK) {
      dataGetterCalls += 1
      return dataGetterCalls === 1 ? fakeData as never : originalDataGetter.call(this)
    })
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('passes raw URL and attachment inputs through to database.copy and preserves output', async function () {
    sandbox.stub(APIClient.prototype, 'auth').get(() => 'credential-token')
    const credentialLookup = sandbox.stub(HerokuApiClient.prototype, 'get')
    const copyResult = {
      credentialCount: undefined, hasAdditionalCredentials: false, source: sourceEndpoint, target: targetEndpoint, transfer, warnings: [],
    }
    fakeData.database.copy.callsFake(copyWith(copyResult))

    const {error, result, stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'postgres://foo.com/bar', 'HEROKU_POSTGRESQL_RED_URL',
    ])

    expect(error).to.be.undefined
    expect(fakeData.database.copy.calledOnce).to.equal(true)
    expect(fakeData.database.copy.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', 'postgres://foo.com/bar', 'HEROKU_POSTGRESQL_RED_URL'])
    expect(fakeData.database.copy.firstCall.args[3].credentialToken).to.equal('credential-token')
    expect(credentialLookup.called).to.equal(false)
    expect(result).to.equal(copyResult)
    expect(stdout).to.equal('')
    expect(stderr).to.include('Starting copy of database bar on foo.com:5432 to RED... done\n')
    expect(stderr).to.include('Copying... done')
  })

  it('uses the raw external target URL identity for confirmation', async function () {
    const externalTarget = {confirm: 'target.example', name: 'database target on target.example:5432'}
    fakeData.database.copy.callsFake(copyWith({
      source: sourceEndpoint, target: externalTarget, transfer, warnings: [],
    }, {target: externalTarget}))

    const {error} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'target', 'HEROKU_POSTGRESQL_RED_URL', 'postgres://target.example/target',
    ])

    expect(error).to.be.undefined
    expect(fakeData.database.copy.calledOnce).to.equal(true)
  })

  it('preserves cross-app attachment references without rewriting source inputs', async function () {
    const crossAppTarget = {confirm: 'BLUE', name: 'BLUE'}
    fakeData.database.copy.callsFake(copyWith({transfer, warnings: []}, {target: crossAppTarget}))

    const {error} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'BLUE', 'HEROKU_POSTGRESQL_RED_URL', 'myotherapp::DATABASE_URL',
    ])

    expect(error).to.be.undefined
    expect(fakeData.database.copy.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', 'HEROKU_POSTGRESQL_RED_URL', 'myotherapp::DATABASE_URL'])
  })

  it('rejects an incorrect external target confirmation before transfer', async function () {
    fakeData.database.copy.callsFake(copyWith({transfer}, {target: {confirm: 'target.example', name: 'database target on target.example:5432'}}))

    const {error} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'target.example', 'HEROKU_POSTGRESQL_RED_URL', 'postgres://target.example/target',
    ])

    expect(error?.message).to.include('Confirmation')
    expect(error?.message).to.include('did not match')
  })

  it('refuses an untrusted data API host before invoking the SDK', async function () {
    const previousDataHost = process.env.HEROKU_DATA_HOST
    process.env.HEROKU_DATA_HOST = 'attacker.example'

    try {
      const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL'])

      expect(error?.message).to.include('Refusing to send Heroku credentials to untrusted data API host')
      expect(`${error?.message}\n${stderr}`).not.to.include('attacker.example')
      expect(fakeData.database.copy.called).to.equal(false)
    } finally {
      if (previousDataHost === undefined) delete process.env.HEROKU_DATA_HOST
      else process.env.HEROKU_DATA_HOST = previousDataHost
    }
  })

  it('refuses non-HTTP schemes even for localhost', async function () {
    const previousDataHost = process.env.HEROKU_DATA_HOST
    process.env.HEROKU_DATA_HOST = 'ftp://localhost'

    try {
      const {error} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL'])

      expect(error?.message).to.include('Refusing to send Heroku credentials to untrusted data API host')
      expect(fakeData.database.copy.called).to.equal(false)
    } finally {
      if (previousDataHost === undefined) delete process.env.HEROKU_DATA_HOST
      else process.env.HEROKU_DATA_HOST = previousDataHost
    }
  })

  for (const {description, host, secret} of [
    {description: 'userinfo credentials', host: 'https://copy-user:copy-password@api.data.heroku.com', secret: 'copy-password'},
    {description: 'non-root paths', host: 'https://api.data.heroku.com/custom/path', secret: 'https://api.data.heroku.com/custom/path'},
    {description: 'query strings', host: 'api.data.heroku.com?', secret: 'api.data.heroku.com?'},
    {description: 'fragments', host: 'api.data.heroku.com#copy-secret', secret: 'copy-secret'},
    {description: 'malformed URLs', host: 'https://[invalid-url', secret: 'https://[invalid-url'},
    {description: 'query strings containing secrets', host: 'https://api.data.heroku.com?token=copy-secret', secret: 'copy-secret'},
  ]) {
    it(`refuses configured data API host with ${description} without exposing it`, async function () {
      const previousDataHost = process.env.HEROKU_DATA_HOST
      process.env.HEROKU_DATA_HOST = host

      try {
        const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL'])

        expect(error?.message).to.include('Invalid data API host')
        expect(`${error?.message}\n${stderr}`).not.to.include(host)
        if (description === 'userinfo credentials') {
          expect(`${error?.message}\n${stderr}`).not.to.include('copy-user')
        }

        expect(`${error?.message}\n${stderr}`).not.to.include(secret)
        expect(fakeData.database.copy.called).to.equal(false)
      } finally {
        if (previousDataHost === undefined) delete process.env.HEROKU_DATA_HOST
        else process.env.HEROKU_DATA_HOST = previousDataHost
      }
    })
  }

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
    fakeData.database.copy.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceEndpoint, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.copyPoller?.onStart?.(preview)
      options.waitPoller?.onStart?.(transfer)
      options.copyPoller?.onStop?.()
      options.onCredentialsChecked?.({credentialCount: 2, hasAdditionalCredentials: true})
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
    expect(stderr).to.include('\ndone\n')
  })

  it('checks source credentials after confirmation and before starting the SDK transfer', async function () {
    const sourceWithDatabase: SourceEndpoint = {...sourceEndpoint, database: {addon: {name: 'source/addon'}}}
    const copyResult = {
      source: sourceWithDatabase,
      target: targetEndpoint,
      transfer,
      warnings: [],
    }
    const sequence: string[] = []
    let clientOptions: DataClientOptions | undefined
    sandbox.stub(ConfirmCommand.prototype, 'confirm').callsFake(async () => {
      sequence.push('confirmed')
    })
    const credentialLookup = sandbox.stub(HerokuApiClient.prototype, 'get').callsFake(async function (this: HerokuApiClient, path) {
      sequence.push('credentials')
      expect(path).to.equal(`/postgres/v0/databases/${encodeURIComponent('source/addon')}/credentials`)
      clientOptions = (this as unknown as {options: DataClientOptions}).options
      return new Response(JSON.stringify([{password: 'credential-secret'}, {}]), {
        headers: {'content-type': 'application/json'},
      })
    })
    sandbox.stub(APIClient.prototype, 'auth').get(() => 'credential-token')
    fakeData.database.copy.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceWithDatabase, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      sequence.push('transfer')
      options.copyPoller?.onStart?.(preview)
      options.waitPoller?.onStart?.(transfer)
      options.copyPoller?.onStop?.()
      options.onCredentialsChecked?.({credentialCount: 1, hasAdditionalCredentials: false})
      options.waitPoller?.onStop?.(transfer)
      return copyResult
    })

    const {error, result, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL',
    ])

    expect(error).to.be.undefined
    expect(result).to.equal(copyResult)
    expect(credentialLookup.calledOnce).to.equal(true)
    expect(sequence).to.deep.equal(['confirmed', 'credentials', 'transfer'])
    expect(clientOptions?.service).to.equal('data')
    expect(clientOptions?.baseUrl).to.equal('https://api.data.heroku.com')
    expect(clientOptions?.headers?.Authorization).to.equal(`Basic ${Buffer.from(':credential-token').toString('base64')}`)
    expect(clientOptions?.token?.()).to.equal('')
    expect(clientOptions?.userAgent?.name).to.equal('heroku-cli')
    expect(clientOptions?.userAgent?.version).to.be.a('string').and.not.empty
    expect(clientOptions?.signal).to.be.instanceOf(AbortSignal)
    expect(stderr).not.to.include('credential-secret')
    expect(stderr.indexOf('only copy your default credential')).to.be.lessThan(stderr.indexOf('Starting copy'))
    expect(stderr.match(/only copy your default credential/g)).to.have.length(1)
  })

  it('continues copying when preflight credential lookup fails without exposing its error', async function () {
    const sourceWithDatabase: SourceEndpoint = {...sourceEndpoint, database: {addon: {name: 'source-addon'}}}
    const secretError = new Error('credential response contained secret-password')
    const credentialLookup = sandbox.stub(HerokuApiClient.prototype, 'get').rejects(secretError)
    sandbox.stub(APIClient.prototype, 'auth').get(() => 'credential-token')
    const copyResult = {
      source: sourceWithDatabase,
      target: targetEndpoint,
      transfer,
      warnings: [],
    }
    fakeData.database.copy.callsFake(copyWith(copyResult, {source: sourceWithDatabase}))

    const {error, result, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL',
    ])

    expect(error).to.be.undefined
    expect(result).to.equal(copyResult)
    expect(credentialLookup.calledOnce).to.equal(true)
    expect(`${error?.message}\n${stderr}`).not.to.include('secret-password')
    expect(stderr).to.include('Starting copy')
  })

  it('keeps the preflight additional-credential warning when the later SDK callback reports false', async function () {
    const sourceWithDatabase: SourceEndpoint = {...sourceEndpoint, database: {addon: {name: 'source-addon'}}}
    sandbox.stub(HerokuApiClient.prototype, 'get').resolves(new Response(JSON.stringify([{}, {}]), {
      headers: {'content-type': 'application/json'},
    }))
    sandbox.stub(APIClient.prototype, 'auth').get(() => 'credential-token')
    const copyResult = {
      source: sourceWithDatabase,
      target: targetEndpoint,
      transfer,
      warnings: [],
    }
    fakeData.database.copy.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceWithDatabase, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.onCredentialsChecked?.({credentialCount: 1, hasAdditionalCredentials: false})
      return copyResult
    })

    const {error, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL',
    ])

    expect(error).to.be.undefined
    expect(stderr.match(/only copy your default credential/g)).to.have.length(1)
  })

  it('passes verbose and polling progress options to database.copy', async function () {
    fakeData.database.copy.callsFake(copyWith({transfer, warnings: []}))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', '--verbose', '--wait-interval', '5', 'DATABASE_URL', 'RED_URL',
    ])

    const options = fakeData.database.copy.firstCall.args[3] as CopyOptions
    expect(options.verbose).to.equal(true)
    expect(options.intervalMs).to.equal(5000)
    expect(options.onPoll).to.be.a('function')
    expect(options.copyPoller?.onStart).to.be.a('function')
    expect(options.waitPoller?.onStart).to.be.a('function')
    expect(stdout).to.include('copy started')
    expect(stdout).to.include('Copying...')
    expect(stderr).to.include('Starting copy of database bar on foo.com:5432 to RED... done\n')
  })

  it('maps TransferFailedError to the legacy failure text and backup info command', async function () {
    const failedTransfer = {...transfer, logs: [{...transfer.logs[0]!, message: 'copy failed'}]}
    fakeData.database.copy.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
      const preview = {source: sourceEndpoint, target: targetEndpoint}
      await options.beforeCopy?.(preview)
      options.copyPoller?.onStart?.(preview)
      throw new TransferFailedError(failedTransfer)
    })

    const {error, stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'RED', 'DATABASE_URL', 'RED_URL',
    ])

    expect(ansis.strip(error!.message)).to.contain('An error occurred and the backup did not finish.')
    expect(ansis.strip(error!.message)).to.contain('copy failed')
    expect(ansis.strip(error!.message)).to.contain('Run heroku pg:backups:info c001 for more details.')
    expect(stdout).to.equal('')
    expect(stderr).to.include('!\n')
  })

  it('stops the copy spinner when transfer creation fails', async function () {
    const error = new Error('transfer create failed')
    fakeData.database.copy.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
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
    fakeData.database.copy.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
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
    fakeData.database.copy.callsFake(async (_app: string, _source: string, _target: string, options: CopyOptions = {}) => {
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
