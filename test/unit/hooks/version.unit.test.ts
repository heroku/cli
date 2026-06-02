import {expect} from 'chai'
import * as sinon from 'sinon'

import versionHook from '../../../src/hooks/init/version.js'

describe('version hook', function () {
  let originalArgv: string[]
  let originalEnv: NodeJS.ProcessEnv
  let warnStub: sinon.SinonStub

  beforeEach(function () {
    // Save original values
    originalArgv = process.argv
    originalEnv = {...process.env}

    // Create stub for warn
    warnStub = sinon.stub()
  })

  afterEach(function () {
    // Restore original values
    process.argv = originalArgv
    process.env = originalEnv
    sinon.restore()
  })

  describe('when command is --version', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', '--version']
    })

    it('warns of set HEROKU_API_KEY with redacted value', async function () {
      process.env.HEROKU_API_KEY = 'secret-api-key-12345'

      const context = {
        config: {
          pjson: {
            oclif: {},
          },
        },
        warn: warnStub,
      }

      const options = {
        argv: process.argv,
        config: context.config as any,
        context: {} as any,
        id: 'version',
      }

      await versionHook.call(context as any, options)

      expect(warnStub.calledOnce).to.be.true
      expect(warnStub.firstCall.args[0]).to.equal('HEROKU_API_KEY set to [REDACTED]')
    })

    it('warns of other allowlisted env vars with their actual values', async function () {
      process.env.HTTPS_PROXY = 'https://proxy.example.com:8080'
      process.env.HEROKU_APP = 'my-test-app'

      const context = {
        config: {
          pjson: {
            oclif: {},
          },
        },
        warn: warnStub,
      }

      const options = {
        argv: process.argv,
        config: context.config as any,
        context: {} as any,
        id: 'version',
      }

      await versionHook.call(context as any, options)

      expect(warnStub.calledTwice).to.be.true
      expect(warnStub.firstCall.args[0]).to.equal('HEROKU_APP set to my-test-app')
      expect(warnStub.secondCall.args[0]).to.equal('HTTPS_PROXY set to https://proxy.example.com:8080')
    })

    it('does not warn when no allowlisted env vars are set', async function () {
      const context = {
        config: {
          pjson: {
            oclif: {},
          },
        },
        warn: warnStub,
      }

      const options = {
        argv: process.argv,
        config: context.config as any,
        context: {} as any,
        id: 'version',
      }

      await versionHook.call(context as any, options)

      expect(warnStub.called).to.be.false
    })
  })

  describe('when command is not --version', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', 'apps:info']
    })

    it('does not warn even if HEROKU_API_KEY is set', async function () {
      process.env.HEROKU_API_KEY = 'secret-api-key-12345'

      const context = {
        config: {
          pjson: {
            oclif: {},
          },
        },
        warn: warnStub,
      }

      const options = {
        argv: process.argv,
        config: context.config as any,
        context: {} as any,
        id: 'version',
      }

      await versionHook.call(context as any, options)

      expect(warnStub.called).to.be.false
    })
  })

  describe('with custom version flags', function () {
    it('warns when using custom version flag', async function () {
      process.argv = ['node', 'heroku', '-v']
      process.env.HEROKU_API_KEY = 'secret-api-key-12345'

      const context = {
        config: {
          pjson: {
            oclif: {
              additionalVersionFlags: ['-v'],
            },
          },
        },
        warn: warnStub,
      }

      const options = {
        argv: process.argv,
        config: context.config as any,
        context: {} as any,
        id: 'version',
      }

      await versionHook.call(context as any, options)

      expect(warnStub.calledOnce).to.be.true
      expect(warnStub.firstCall.args[0]).to.equal('HEROKU_API_KEY set to [REDACTED]')
    })
  })
})
