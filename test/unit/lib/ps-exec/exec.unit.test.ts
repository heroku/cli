import type {BuildpackInstallation, ConfigVar, Dyno} from '@heroku/types/3.sdk'

import {hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {DynoCrashedError, dynoExtensions} from '@heroku/sdk/extensions/platform'
import {Errors, ux} from '@oclif/core'
import {expect} from 'chai'
import child from 'node:child_process'
import {
  match,
  restore,
  SinonStub,
  stub,
} from 'sinon'

import {HerokuExec} from '../../../../src/lib/ps-exec/exec.js'
import {mockSDKPlatform} from '../../../helpers/mock-sdk.js'

/**
 * Builds a fake `platform` client with every `dyno.*` method the exec
 * flow calls stubbed out, then wires it in via `mockSDKPlatform` and
 * returns a real `platform` obtained from a fresh `HerokuSDK()` (so the
 * test exercises the same getter production code uses). Individual
 * tests override only the stubs they care about.
 */
function stubPlatform(overrides: Record<string, SinonStub> = {}) {
  const fakePlatform = {
    dyno: {
      enableExec: stub().resolves(),
      exchangeExecCredentials: stub().resolves({}),
      execPrereqs: stub().resolves({
        buildpacks: [],
        buildStack: undefined,
        configVars: {},
        featureEnabled: true,
        generation: 'cedar',
        space: null,
      }),
      execStatus: stub().resolves([]),
      list: stub().resolves([]),
      restartForExec: stub().resolves({name: 'web.1', state: 'up'}),
      ...overrides,
    },
  }

  mockSDKPlatform(fakePlatform)
  const {platform} = new HerokuSDK({extensions: [dynoExtensions]})
  return {fakePlatform, platform}
}

describe('HerokuExec', function () {
  let herokuExec: HerokuExec
  let uxActionStartStub: SinonStub
  let uxActionStopStub: SinonStub
  let uxStdoutStub: SinonStub
  let uxWarnStub: SinonStub
  let huxPromptStub: SinonStub
  let huxStyledHeaderStub: SinonStub
  let huxTableStub: SinonStub

  beforeEach(function () {
    herokuExec = new HerokuExec()
    uxActionStartStub = stub(ux.action, 'start')
    uxActionStopStub = stub(ux.action, 'stop')
    uxStdoutStub = stub(ux, 'stdout')
    uxWarnStub = stub(ux, 'warn')
    huxPromptStub = stub(hux, 'prompt').resolves('n')
    huxStyledHeaderStub = stub(hux, 'styledHeader')
    huxTableStub = stub(hux, 'table')
  })

  afterEach(function () {
    restore()
    delete process.env.HEROKU_API_KEY
    delete process.env.HEROKU_HEADERS
  })

  describe('_apiKey()', function () {
    it('returns process.env.HEROKU_API_KEY when it is defined', function () {
      process.env.HEROKU_API_KEY = 'env-api-key'
      const context = {app: 'myapp', auth: {password: 'auth-password'}, flags: {}}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._apiKey(context)
      expect(result).to.equal('env-api-key')
    })

    it('falls back to context.auth.password when HEROKU_API_KEY is undefined', function () {
      const context = {app: 'myapp', auth: {password: 'auth-password'}, flags: {}}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._apiKey(context)
      expect(result).to.equal('auth-password')
    })

    it('returns an empty string when neither is set', function () {
      const context = {app: 'myapp', auth: {password: undefined}, flags: {}}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._apiKey(context)
      expect(result).to.equal('')
    })
  })

  describe('_dyno()', function () {
    it('returns context.flags.dyno when the flag is set', function () {
      const context = {app: 'myapp', auth: {password: 'pass'}, flags: {dyno: 'worker.2'}}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._dyno(context)
      expect(result).to.equal('worker.2')
    })

    it('returns web.1 when context.flags.dyno is falsy/undefined', function () {
      const context = {app: 'myapp', auth: {password: 'pass'}, flags: {}}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._dyno(context)
      expect(result).to.equal('web.1')
    })
  })

  describe('_hasExecBuildpack()', function () {
    const urls = ['https://github.com/heroku/exec-buildpack', 'urn:buildpack:heroku/exec']

    it('returns true when a buildpack URL exactly starts with a target URL', function () {
      const buildpacks: BuildpackInstallation[] = [
        {buildpack: {url: 'https://github.com/heroku/exec-buildpack'}, ordinal: 1},
      ]
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._hasExecBuildpack(buildpacks, urls)
      expect(result).to.be.true
    })

    it('returns true when using the urn:buildpack:heroku/exec alternative URL', function () {
      const buildpacks: BuildpackInstallation[] = [
        {buildpack: {url: 'urn:buildpack:heroku/exec'}, ordinal: 1},
      ]
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._hasExecBuildpack(buildpacks, urls)
      expect(result).to.be.true
    })

    it('returns false when no buildpack URLs match any target URL', function () {
      const buildpacks: BuildpackInstallation[] = [
        {buildpack: {url: 'https://github.com/heroku/ruby-buildpack'}, ordinal: 1},
      ]
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._hasExecBuildpack(buildpacks, urls)
      expect(result).to.be.false
    })

    it('returns false for an empty buildpacks array', function () {
      const buildpacks: BuildpackInstallation[] = []
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._hasExecBuildpack(buildpacks, urls)
      expect(result).to.be.false
    })

    it('returns false for an empty urls array', function () {
      const buildpacks: BuildpackInstallation[] = [
        {buildpack: {url: 'https://github.com/heroku/exec-buildpack'}, ordinal: 1},
      ]
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._hasExecBuildpack(buildpacks, [])
      expect(result).to.be.false
    })
  })

  describe('_execHeaders()', function () {
    it('returns parsed JSON from process.env.HEROKU_HEADERS when set', function () {
      process.env.HEROKU_HEADERS = '{"X-Custom-Header":"value"}'
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execHeaders()
      expect(result).to.deep.equal({'X-Custom-Header': 'value'})
    })

    it('returns an empty object {} when HEROKU_HEADERS is not set', function () {
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execHeaders()
      expect(result).to.deep.equal({})
    })
  })

  describe('checkStatus()', function () {
    const context = {
      app: 'myapp',
      auth: {password: 'pass'},
      flags: {},
    }

    it('displays styled header with the app name', async function () {
      const configVars: ConfigVar = {}
      const {platform} = stubPlatform({
        execStatus: stub().resolves([]),
        list: stub().resolves([]),
      })

      try {
        await herokuExec.checkStatus(context, platform, configVars)
      } catch {
        // Expected to throw after displaying header
      }

      expect(huxStyledHeaderStub.calledOnce).to.be.true
      expect(huxStyledHeaderStub.firstCall.args[0]).to.include('myapp')
    })

    it('outputs error message when the reservations list is empty', async function () {
      const configVars: ConfigVar = {}
      const {platform} = stubPlatform({
        execStatus: stub().resolves([]),
        list: stub().resolves([]),
      })

      try {
        await herokuExec.checkStatus(context, platform, configVars)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('Heroku Exec is not running')
      }
    })

    it('renders a table row per reservation with proxy_status: running', async function () {
      const configVars: ConfigVar = {}
      const dynos = [{name: 'web.1', state: 'up'}]
      const reservations = [{dyno_name: 'web.1', proxy_status: 'running'}]
      const {platform} = stubPlatform({
        execStatus: stub().resolves(reservations),
        list: stub().resolves(dynos as unknown as Dyno[]),
      })

      await herokuExec.checkStatus(context, platform, configVars)

      expect(huxTableStub.calledOnce).to.be.true
      const tableData = huxTableStub.firstCall.args[0]
      expect(tableData[0]).to.have.property('proxy_status', 'running')
    })

    it('throws an error when the HTTP request rejects', async function () {
      const configVars: ConfigVar = {}
      const {platform} = stubPlatform({
        execStatus: stub().rejects(new Error('Internal Server Error')),
        list: stub().resolves([]),
      })

      try {
        await herokuExec.checkStatus(context, platform, configVars)
        expect.fail('should have thrown')
      } catch (error) {
        // Error thrown as expected
        expect(error).to.exist
      }
    })
  })

  describe('initFeature()', function () {
    const context = {
      app: 'myapp',
      auth: {password: 'pass'},
      flags: {},
    }

    it('shows exec-specific error message and exits when app generation is fir and command === exec', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: undefined,
          configVars: {},
          featureEnabled: false,
          generation: 'fir',
          space: null,
        }),
      })

      try {
        await herokuExec.initFeature(context, platform, callback, 'exec')
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('heroku run:inside')
      }
    })

    it('shows generic unavailable message and exits when app generation is fir and command is anything else', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: undefined,
          configVars: {},
          featureEnabled: false,
          generation: 'fir',
          space: null,
        }),
      })

      try {
        await herokuExec.initFeature(context, platform, callback, 'other')
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('unavailable for this app')
      }
    })

    it('errors and exits when app is in a Shield Private Space', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: 'heroku-20',
          configVars: {},
          featureEnabled: false,
          generation: 'cedar',
          space: {shield: true},
        }),
      })

      try {
        await herokuExec.initFeature(context, platform, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('Shield Private Spaces')
      }
    })

    it('warns (does not exit) when app is in a non-shield space using the container stack', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [{buildpack: {url: 'https://github.com/heroku/ruby-buildpack'}, ordinal: 1}],
          buildStack: 'container',
          configVars: {},
          featureEnabled: true,
          generation: 'cedar',
          space: {shield: false},
        }),
      })

      await herokuExec.initFeature(context, platform, callback)

      expect(uxWarnStub.calledOnce).to.be.true
      expect(uxWarnStub.firstCall.args[0]).to.include('container stack')
    })

    it('errors and exits when app is in a space, has no buildpacks, and no exec buildpack', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: 'heroku-20',
          configVars: {},
          featureEnabled: false,
          generation: 'cedar',
          space: {shield: false},
        }),
      })

      try {
        await herokuExec.initFeature(context, platform, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('no Buildpack URL set')
      }
    })

    it('enables feature, adds exec buildpack, and exits when app is in a space and exec buildpack is missing', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        enableExec: stub().resolves(),
        execPrereqs: stub().resolves({
          buildpacks: [{buildpack: {url: 'https://github.com/heroku/ruby-buildpack'}, ordinal: 1}],
          buildStack: 'heroku-20',
          configVars: {},
          featureEnabled: false,
          generation: 'cedar',
          space: {shield: false},
        }),
      })

      const childExecSyncStub = stub(child, 'execSync')

      try {
        await herokuExec.initFeature(context, platform, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {oclif} = error as Errors.ExitError
        expect(uxActionStartStub.calledWith('Initializing feature')).to.be.true
        expect(uxStdoutStub.called).to.be.true
        expect(childExecSyncStub.calledWith(match(/heroku buildpacks:add/))).to.be.true
        expect(oclif.exit).to.equal(0)
      }
    })

    it('warns to remove exec buildpack when app is NOT in a space but already has the exec buildpack installed', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [{buildpack: {url: 'https://github.com/heroku/exec-buildpack'}, ordinal: 1}],
          buildStack: 'heroku-20',
          configVars: {},
          featureEnabled: true,
          generation: 'cedar',
          space: null,
        }),
      })

      await herokuExec.initFeature(context, platform, callback)

      expect(uxWarnStub.calledOnce).to.be.true
      expect(uxWarnStub.firstCall.args[0]).to.include('no longer required')
    })

    it('errors and exits when HEROKU_EXEC_URL config var is present (legacy addon path)', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: 'heroku-20',
          configVars: {HEROKU_EXEC_URL: 'https://legacy.heroku.com'},
          featureEnabled: false,
          generation: 'cedar',
          space: null,
        }),
      })

      try {
        await herokuExec.initFeature(context, platform, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('Heroku Exec addon')
      }
    })

    it('exits without enabling feature when user answers n to the prompt', async function () {
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: 'heroku-20',
          configVars: {},
          featureEnabled: false,
          generation: 'cedar',
          space: null,
        }),
      })

      huxPromptStub.resolves('n')

      try {
        await herokuExec.initFeature(context, platform, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {oclif} = error as Errors.ExitError
        expect(huxPromptStub.calledOnce).to.be.true
        expect(oclif.exit).to.equal(0)
      }
    })

    it('answers y to the restart prompt, restarts dynos, and invokes callback', async function () {
      const callback = stub()
      const restartForExecStub = stub().resolves({name: 'web.1', state: 'up'})
      const {platform} = stubPlatform({
        enableExec: stub().resolves(),
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: 'heroku-20',
          configVars: {},
          featureEnabled: false,
          generation: 'cedar',
          space: null,
        }),
        restartForExec: restartForExecStub,
      })

      huxPromptStub.resolves('y')

      await herokuExec.initFeature(context, platform, callback)

      expect(restartForExecStub.calledOnce).to.be.true
      expect(callback.calledOnce).to.be.true
    })

    it('throws "The dyno crashed" when restartForExec rejects with DynoCrashedError', async function () {
      const callback = stub()
      const crashedDyno = {name: 'web.1', state: 'crashed'} as unknown as Dyno
      const {platform} = stubPlatform({
        enableExec: stub().resolves(),
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: 'heroku-20',
          configVars: {},
          featureEnabled: false,
          generation: 'cedar',
          space: null,
        }),
        restartForExec: stub().rejects(new DynoCrashedError(crashedDyno)),
      })

      huxPromptStub.resolves('y')

      try {
        await herokuExec.initFeature(context, platform, callback)
        expect.fail('should have thrown')
      } catch (error) {
        expect((error as Error).message).to.equal('The dyno crashed')
        expect(callback.called).to.be.false
      }
    })

    it('calls callback(configVars) when feature is already enabled', async function () {
      const configVars: ConfigVar = {}
      const callback = stub()
      const {platform} = stubPlatform({
        execPrereqs: stub().resolves({
          buildpacks: [],
          buildStack: 'heroku-20',
          configVars,
          featureEnabled: true,
          generation: 'cedar',
          space: null,
        }),
      })

      await herokuExec.initFeature(context, platform, callback)

      expect(callback.calledOnce).to.be.true
      expect(callback.firstCall.args[0]).to.deep.equal(configVars)
    })
  })

  describe('updateClientKey()', function () {
    const context = {
      app: 'myapp',
      auth: {password: 'pass'},
      flags: {},
    }

    it('generates a keypair and calls exchangeExecCredentials', async function () {
      const configVars: ConfigVar = {}
      const callback = stub()
      const exchangeStub = stub().resolves({
        client_user: 'myapp',
        dyno_ip: '10.0.0.1',
        proxy_public_key: 'ssh-rsa AAAA',
        tunnel_host: 'tunnel.heroku.com',
      })
      const {platform} = stubPlatform({exchangeExecCredentials: exchangeStub})

      await herokuExec.updateClientKey(context, platform, configVars, callback)

      expect(uxActionStartStub.calledWith('Establishing credentials')).to.be.true
      expect(uxActionStopStub.calledOnce).to.be.true
      expect(exchangeStub.calledOnce).to.be.true
    })

    it('calls callback with (privateKey, dyno, credentials) on success', async function () {
      const configVars: ConfigVar = {}
      const callback = stub()
      const exchangeStub = stub().resolves({
        client_user: 'myapp',
        dyno_ip: '10.0.0.1',
        proxy_public_key: 'ssh-rsa AAAA',
        tunnel_host: 'tunnel.heroku.com',
      })
      const {platform} = stubPlatform({exchangeExecCredentials: exchangeStub})

      await herokuExec.updateClientKey(context, platform, configVars, callback)

      expect(callback.calledOnce).to.be.true
      expect(callback.firstCall.args[0]).to.be.a('string') // privateKey
      expect(callback.firstCall.args[1]).to.equal('web.1') // dyno
      expect(callback.firstCall.args[2]).to.have.property('tunnel_host', 'tunnel.heroku.com') // credentials
    })

    it('shows "Could not connect to dyno" error and does not call callback when the request rejects', async function () {
      const configVars: ConfigVar = {}
      const callback = stub()
      const {platform} = stubPlatform({
        exchangeExecCredentials: stub().rejects(new Error('Internal Server Error')),
      })

      try {
        await herokuExec.updateClientKey(context, platform, configVars, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(uxActionStopStub.calledWith('error')).to.be.true
        expect(message).to.include('Could not connect to dyno')
        expect(callback.called).to.be.false
      }
    })
  })
})
