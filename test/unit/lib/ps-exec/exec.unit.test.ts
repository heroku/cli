import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {Errors} from '@oclif/core'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import nock from 'nock'
import child from 'node:child_process'
import sinon from 'sinon'

import {HerokuExec} from '../../../../src/lib/ps-exec/exec.js'
import {BuildpackInstallation} from '../../../../src/lib/types/fir.js'
import {getHerokuAPI} from '../../../helpers/testInstances.js'

describe('HerokuExec', function () {
  let herokuAPI: APIClient
  let herokuExec: HerokuExec
  let uxActionStartStub: sinon.SinonStub
  let uxActionStopStub: sinon.SinonStub
  let uxStdoutStub: sinon.SinonStub
  let uxWarnStub: sinon.SinonStub
  let huxPromptStub: sinon.SinonStub
  let huxStyledHeaderStub: sinon.SinonStub
  let huxTableStub: sinon.SinonStub

  beforeEach(async function () {
    herokuAPI = await getHerokuAPI()
    herokuExec = new HerokuExec()
    uxActionStartStub = sinon.stub(ux.action, 'start')
    uxActionStopStub = sinon.stub(ux.action, 'stop')
    uxStdoutStub = sinon.stub(ux, 'stdout')
    uxWarnStub = sinon.stub(ux, 'warn')
    huxPromptStub = sinon.stub(hux, 'prompt').resolves('n')
    huxStyledHeaderStub = sinon.stub(hux, 'styledHeader')
    huxTableStub = sinon.stub(hux, 'table')
  })

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
    delete process.env.HEROKU_EXEC_URL
    delete process.env.HEROKU_API_KEY
    delete process.env.HEROKU_HEADERS
  })

  describe('_execApiPath()', function () {
    it('returns /api/v1 when configVars[HEROKU_EXEC_URL] is present', function () {
      const configVars = {HEROKU_EXEC_URL: 'https://exec.heroku.com'}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execApiPath(configVars)
      expect(result).to.equal('/api/v1')
    })

    it('returns /api/v2 when configVars[HEROKU_EXEC_URL] is absent', function () {
      const configVars = {}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execApiPath(configVars)
      expect(result).to.equal('/api/v2')
    })
  })

  describe('_execUrl()', function () {
    const context = {
      app: 'myapp',
      auth: {password: 'auth-password'},
      flags: {},
    }

    it('parses and returns configVars[HEROKU_EXEC_URL] directly when set', function () {
      const configVars = {HEROKU_EXEC_URL: 'https://user:pass@exec.heroku.com:8080'}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execUrl(context, configVars)
      expect(result.href).to.equal('https://user:pass@exec.heroku.com:8080/')
      expect(result.username).to.equal('user')
      expect(result.password).to.equal('pass')
    })

    it('falls back to process.env.HEROKU_EXEC_URL when configVar is unset but env var is defined', function () {
      process.env.HEROKU_EXEC_URL = 'https://env.exec.heroku.com'
      const configVars = {}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execUrl(context, configVars)
      expect(result.host).to.equal('env.exec.heroku.com')
    })

    it('uses default https://exec-manager.heroku.com/ when neither configVar nor env var is set', function () {
      const configVars = {}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execUrl(context, configVars)
      expect(result.host).to.equal('exec-manager.heroku.com')
    })

    it('sets username to context.app when using default/env URL path', function () {
      const configVars = {}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execUrl(context, configVars)
      expect(result.username).to.equal('myapp')
    })

    it('uses process.env.HEROKU_API_KEY as password when it is defined', function () {
      process.env.HEROKU_API_KEY = 'env-api-key'
      const configVars = {}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execUrl(context, configVars)
      expect(result.password).to.equal('env-api-key')
    })

    it('falls back to context.auth.password when HEROKU_API_KEY is undefined', function () {
      const configVars = {}
      // @ts-expect-error - accessing private method for testing
      const result = herokuExec._execUrl(context, configVars)
      expect(result.password).to.equal('auth-password')
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
      const configVars = {}
      const dynos: Heroku.Dyno[] = []

      nock('https://api.heroku.com')
        .get('/apps/myapp/dynos')
        .reply(200, dynos)

      nock('https://exec-manager.heroku.com')
        .get('/api/v2')
        .reply(200, [])

      try {
        await herokuExec.checkStatus(context, herokuAPI, configVars)
      } catch {
        // Expected to throw after displaying header
      }

      expect(huxStyledHeaderStub.calledOnce).to.be.true
      expect(huxStyledHeaderStub.firstCall.args[0]).to.include('myapp')
    })

    it('outputs error message when the reservations list is empty', async function () {
      const configVars = {}
      const dynos: Heroku.Dyno[] = []

      nock('https://api.heroku.com')
        .get('/apps/myapp/dynos')
        .reply(200, dynos)

      nock('https://exec-manager.heroku.com')
        .get('/api/v2')
        .reply(200, [])

      try {
        await herokuExec.checkStatus(context, herokuAPI, configVars)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('Heroku Exec is not running')
      }
    })

    it('renders a table row per reservation with proxy_status: running', async function () {
      const configVars = {}
      const dynos: Heroku.Dyno[] = [{name: 'web.1', state: 'up'}]
      const reservations = [{dyno_name: 'web.1', proxy_status: 'running'}]

      nock('https://api.heroku.com')
        .get('/apps/myapp/dynos')
        .reply(200, dynos)

      nock('https://exec-manager.heroku.com')
        .get('/api/v2')
        .reply(200, JSON.stringify(reservations), {'Content-Type': 'application/json'})

      await herokuExec.checkStatus(context, herokuAPI, configVars)

      expect(huxTableStub.calledOnce).to.be.true
      const tableData = huxTableStub.firstCall.args[0]
      expect(tableData[0]).to.have.property('proxy_status', 'running')
    })

    it('throws an error when the HTTP request rejects', async function () {
      const configVars = {}
      const dynos: Heroku.Dyno[] = []

      nock('https://api.heroku.com')
        .get('/apps/myapp/dynos')
        .reply(200, dynos)

      nock('https://exec-manager.heroku.com')
        .get('/api/v2')
        .reply(500, 'Internal Server Error')

      try {
        await herokuExec.checkStatus(context, herokuAPI, configVars)
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
      const app = {generation: 'fir', space: null}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)

      try {
        await herokuExec.initFeature(context, herokuAPI, callback, 'exec')
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('heroku run:inside')
      }
    })

    it('shows generic unavailable message and exits when app generation is fir and command is anything else', async function () {
      const app = {generation: 'fir', space: null}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)

      try {
        await herokuExec.initFeature(context, herokuAPI, callback, 'other')
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('unavailable for this app')
      }
    })

    it('errors and exits when app is in a Shield Private Space', async function () {
      const app = {build_stack: {name: 'heroku-20'}, generation: 'cedar', space: {shield: true}}
      const buildpacks: BuildpackInstallation[] = []
      const configVars = {}
      const feature = {enabled: false}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)
        .get('/apps/myapp/buildpack-installations')
        .reply(200, buildpacks)
        .get('/apps/myapp/config-vars')
        .reply(200, configVars)
        .get('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, feature)

      try {
        await herokuExec.initFeature(context, herokuAPI, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('Shield Private Spaces')
      }
    })

    it('warns (does not exit) when app is in a non-shield space using the container stack', async function () {
      const app = {build_stack: {name: 'container'}, generation: 'cedar', space: {shield: false}}
      const buildpacks: BuildpackInstallation[] = [{buildpack: {url: 'https://github.com/heroku/ruby-buildpack'}, ordinal: 1}]
      const configVars = {}
      const feature = {enabled: true}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)
        .get('/apps/myapp/buildpack-installations')
        .reply(200, buildpacks)
        .get('/apps/myapp/config-vars')
        .reply(200, configVars)
        .get('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, feature)

      await herokuExec.initFeature(context, herokuAPI, callback)

      expect(uxWarnStub.calledOnce).to.be.true
      expect(uxWarnStub.firstCall.args[0]).to.include('container stack')
    })

    it('errors and exits when app is in a space, has no buildpacks, and no exec buildpack', async function () {
      const app = {build_stack: {name: 'heroku-20'}, generation: 'cedar', space: {shield: false}}
      const buildpacks: BuildpackInstallation[] = []
      const configVars = {}
      const feature = {enabled: false}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)
        .get('/apps/myapp/buildpack-installations')
        .reply(200, buildpacks)
        .get('/apps/myapp/config-vars')
        .reply(200, configVars)
        .get('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, feature)

      try {
        await herokuExec.initFeature(context, herokuAPI, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('no Buildpack URL set')
      }
    })

    it('enables feature, adds exec buildpack, and exits when app is in a space and exec buildpack is missing', async function () {
      const app = {build_stack: {name: 'heroku-20'}, generation: 'cedar', space: {shield: false}}
      const buildpacks: BuildpackInstallation[] = [{buildpack: {url: 'https://github.com/heroku/ruby-buildpack'}, ordinal: 1}]
      const configVars = {}
      const feature = {enabled: false}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)
        .get('/apps/myapp/buildpack-installations')
        .reply(200, buildpacks)
        .get('/apps/myapp/config-vars')
        .reply(200, configVars)
        .get('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, feature)
        .patch('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, {enabled: true})

      const childExecSyncStub = sinon.stub(child, 'execSync')

      try {
        await herokuExec.initFeature(context, herokuAPI, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {oclif} = error as Errors.ExitError
        expect(uxActionStartStub.calledWith('Initializing feature')).to.be.true
        expect(uxStdoutStub.called).to.be.true
        expect(childExecSyncStub.calledOnce).to.be.true
        expect(oclif.exit).to.equal(0)
      }
    })

    it('warns to remove exec buildpack when app is NOT in a space but already has the exec buildpack installed', async function () {
      const app = {build_stack: {name: 'heroku-20'}, generation: 'cedar', space: null}
      const buildpacks: BuildpackInstallation[] = [{buildpack: {url: 'https://github.com/heroku/exec-buildpack'}, ordinal: 1}]
      const configVars = {}
      const feature = {enabled: true}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)
        .get('/apps/myapp/buildpack-installations')
        .reply(200, buildpacks)
        .get('/apps/myapp/config-vars')
        .reply(200, configVars)
        .get('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, feature)

      await herokuExec.initFeature(context, herokuAPI, callback)

      expect(uxWarnStub.calledOnce).to.be.true
      expect(uxWarnStub.firstCall.args[0]).to.include('no longer required')
    })

    it('errors and exits when HEROKU_EXEC_URL config var is present (legacy addon path)', async function () {
      const app = {build_stack: {name: 'heroku-20'}, generation: 'cedar', space: null}
      const buildpacks: BuildpackInstallation[] = []
      const configVars = {HEROKU_EXEC_URL: 'https://legacy.heroku.com'}
      const feature = {enabled: false}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)
        .get('/apps/myapp/buildpack-installations')
        .reply(200, buildpacks)
        .get('/apps/myapp/config-vars')
        .reply(200, configVars)
        .get('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, feature)

      try {
        await herokuExec.initFeature(context, herokuAPI, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('Heroku Exec addon')
      }
    })

    it('exits without enabling feature when user answers n to the prompt', async function () {
      const app = {build_stack: {name: 'heroku-20'}, generation: 'cedar', space: null}
      const buildpacks: BuildpackInstallation[] = []
      const configVars = {}
      const feature = {enabled: false}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)
        .get('/apps/myapp/buildpack-installations')
        .reply(200, buildpacks)
        .get('/apps/myapp/config-vars')
        .reply(200, configVars)
        .get('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, feature)

      huxPromptStub.resolves('n')

      try {
        await herokuExec.initFeature(context, herokuAPI, callback)
        expect.fail('should have thrown')
      } catch (error) {
        const {oclif} = error as Errors.ExitError
        expect(huxPromptStub.calledOnce).to.be.true
        expect(oclif.exit).to.equal(0)
      }
    })

    it('calls callback(configVars) when feature is already enabled', async function () {
      const app = {build_stack: {name: 'heroku-20'}, generation: 'cedar', space: null}
      const buildpacks: BuildpackInstallation[] = []
      const configVars = {}
      const feature = {enabled: true}
      const callback = sinon.stub()

      nock('https://api.heroku.com')
        .get('/apps/myapp')
        .reply(200, app)
        .get('/apps/myapp/buildpack-installations')
        .reply(200, buildpacks)
        .get('/apps/myapp/config-vars')
        .reply(200, configVars)
        .get('/apps/myapp/features/runtime-heroku-exec')
        .reply(200, feature)

      await herokuExec.initFeature(context, herokuAPI, callback)

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

    it('generates a keypair and sends the public key via PUT request', async function () {
      const configVars = {}
      const callback = sinon.stub()

      nock('https://exec-manager.heroku.com')
        .put('//api/v2/web.1')
        .reply(200, JSON.stringify({dyno_ip: '10.0.0.1', tunnel_host: 'tunnel.heroku.com'}), {'Content-Type': 'application/json'})

      await herokuExec.updateClientKey(context, herokuAPI, configVars, callback)

      expect(uxActionStartStub.calledWith('Establishing credentials')).to.be.true
      expect(uxActionStopStub.calledOnce).to.be.true
    })

    it('calls callback with (privateKey, dyno, response) on success', async function () {
      const configVars = {}
      const callback = sinon.stub()

      nock('https://exec-manager.heroku.com')
        .put('//api/v2/web.1')
        .reply(200, JSON.stringify({dyno_ip: '10.0.0.1', tunnel_host: 'tunnel.heroku.com'}), {'Content-Type': 'application/json'})

      await herokuExec.updateClientKey(context, herokuAPI, configVars, callback)

      expect(callback.calledOnce).to.be.true
      expect(callback.firstCall.args[0]).to.be.a('string') // privateKey
      expect(callback.firstCall.args[1]).to.equal('web.1') // dyno
      expect(callback.firstCall.args[2]).to.have.property('body') // response
    })

    it('shows "Could not connect to dyno" error and does not call callback when the request rejects', async function () {
      const configVars = {}
      const callback = sinon.stub()

      nock('https://exec-manager.heroku.com')
        .put('/api/v2/web.1')
        .reply(500, 'Internal Server Error')

      try {
        await herokuExec.updateClientKey(context, herokuAPI, configVars, callback)
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
