import {expect} from 'chai'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import * as sinon from 'sinon'

import configureGitCredentialManagerHook from '../../../src/hooks/init/configure-git-credential-manager.js'
import Git from '../../../src/lib/git/git.js'

const callHook = async (id: string) => {
  // The hook reads `this.config.pjson.oclif.additionalVersionFlags`, so the bound
  // `this` context must carry a real config to exercise the production code path
  // (this.config IS set when oclif invokes the hook).
  const config = {pjson: {oclif: {additionalVersionFlags: ['-v', 'version']}}}
  const context = {config}
  const options = {
    argv: [],
    config: config as any,
    context: {} as any,
    id,
  }

  await configureGitCredentialManagerHook.call(context as any, options)
}

describe('configure-git-credential-manager hook', function () {
  let originalArgv: string[]
  let configureStub: sinon.SinonStub

  beforeEach(function () {
    // Save original argv since the hook reads process.argv[2]
    originalArgv = process.argv

    // Stub on the prototype so the real git subprocess never runs
    configureStub = sinon.stub(Git.prototype, 'configureCredentialHelper').resolves()
  })

  afterEach(function () {
    process.argv = originalArgv
    sinon.restore()
  })

  describe('when a normal command is invoked', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', 'apps']
    })

    it('configures the git credential helper exactly once', async function () {
      await callHook('apps')

      expect(configureStub.calledOnce).to.be.true
    })
  })

  describe('when configuring the credential helper fails', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', 'apps']
      configureStub.rejects(new Error('Git not found'))
    })

    it('does not throw', async function () {
      try {
        await callHook('apps')
      } catch (error: any) {
        expect.fail(`hook should not throw, but threw: ${error.message}`)
      }

      expect(configureStub.calledOnce).to.be.true
    })
  })

  describe('when command is --version', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', '--version']
    })

    it('does not configure the git credential helper', async function () {
      await callHook('version')

      expect(configureStub.called).to.be.false
    })
  })

  describe('when command is the version command', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', 'version']
    })

    it('does not configure the git credential helper', async function () {
      await callHook('version')

      expect(configureStub.called).to.be.false
    })
  })

  describe('when command is -v', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', '-v']
    })

    it('does not configure the git credential helper', async function () {
      await callHook('version')

      expect(configureStub.called).to.be.false
    })
  })

  describe('when command is autocomplete', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', 'autocomplete']
    })

    it('does not configure the git credential helper', async function () {
      await callHook('autocomplete')

      expect(configureStub.called).to.be.false
    })
  })

  describe('when command is autocomplete:options (the real completion path)', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku', 'autocomplete:options', 'apps']
    })

    it('does not configure the git credential helper', async function () {
      await callHook('autocomplete:options')

      expect(configureStub.called).to.be.false
    })
  })

  describe('when no command argument is provided', function () {
    beforeEach(function () {
      process.argv = ['node', 'heroku']
    })

    it('does not configure the git credential helper', async function () {
      await callHook('')

      expect(configureStub.called).to.be.false
    })
  })

  // Registration regression guard: the unit tests above call the hook function
  // directly, so they pass even if the hook is removed from package.json. This
  // pins the oclif `init` hook list so an accidental deletion or path typo —
  // including a botched removal when this temporary hook is taken out at v12 —
  // fails a test instead of silently disabling the feature.
  describe('oclif init hook registration', function () {
    it('registers the expected init hooks in package.json', function () {
      const root = fileURLToPath(new URL('.', import.meta.url))
      const pjsonPath = join(root, '..', '..', '..', 'package.json')
      const pjson = JSON.parse(readFileSync(pjsonPath, 'utf8'))

      expect(pjson.oclif.hooks.init).to.deep.equal([
        './dist/hooks/init/version',
        './dist/hooks/init/terms-of-service',
        './dist/hooks/init/setup-otel-telemetry',
        './dist/hooks/init/configure-git-credential-manager',
      ])
    })
  })
})
