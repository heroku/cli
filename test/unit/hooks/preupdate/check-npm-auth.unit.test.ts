import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import * as os from 'node:os'
import path from 'node:path'
import * as sinon from 'sinon'

import checkNpmAuth from '../../../../src/hooks/preupdate/check-npm-auth.js'
import {NpmAuth} from '../../../../src/lib/npm-auth.js'

describe('check-npm-auth hook', function () {
  let hookContext: any
  let testDataDir: string
  let isNpmAvailableStub: sinon.SinonStub
  let isPrivatePackageStub: sinon.SinonStub
  let isAuthenticatedStub: sinon.SinonStub
  let loginStub: sinon.SinonStub
  let inquirerPromptStub: sinon.SinonStub
  let uxWarnStub: sinon.SinonStub

  beforeEach(async function () {
    // Create a temporary directory for each test
    testDataDir = path.join(os.tmpdir(), `test-npm-auth-${Date.now()}`)
    await fs.ensureDir(testDataDir)

    hookContext = {
      config: {
        dataDir: testDataDir,
      },
      debug: sinon.stub(),
      error(msg: string, opts: any) {
        const error: any = new Error(msg)
        error.oclif = {exit: opts.exit}
        throw error
      },
    }

    // Stub NpmAuth methods
    isNpmAvailableStub = sinon.stub(NpmAuth, 'isNpmAvailable').resolves(true)
    isPrivatePackageStub = sinon.stub(NpmAuth, 'isPrivatePackage').resolves(false)
    isAuthenticatedStub = sinon.stub(NpmAuth, 'isAuthenticated').resolves(true)
    loginStub = sinon.stub(NpmAuth, 'login').resolves(true)

    // Stub inquirer and ux
    inquirerPromptStub = sinon.stub(inquirer, 'prompt')
    uxWarnStub = sinon.stub(ux, 'warn')
    sinon.stub(ux, 'stdout')
  })

  afterEach(async function () {
    // Clean up test directory
    await fs.remove(testDataDir)
    sinon.restore()
  })

  describe('when npm is not available', function () {
    it('should return early without checking plugins', async function () {
      isNpmAvailableStub.resolves(false)

      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@oclif/plugin-help': '5.0.0',
        },
      })

      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      expect(isPrivatePackageStub.called).to.be.false
      expect(isAuthenticatedStub.called).to.be.false
    })
  })

  describe('when no plugins are installed', function () {
    it('should return early without checking anything', async function () {
      // Don't create package.json - no plugins installed
      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      expect(isPrivatePackageStub.called).to.be.false
      expect(isAuthenticatedStub.called).to.be.false
    })
  })

  describe('when plugin list is empty', function () {
    it('should return early without checking anything', async function () {
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {},
      })

      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      expect(isPrivatePackageStub.called).to.be.false
      expect(isAuthenticatedStub.called).to.be.false
    })
  })

  describe('when only public plugins are installed', function () {
    it('should check plugins but not prompt for authentication', async function () {
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@oclif/plugin-help': '5.0.0',
          '@oclif/plugin-update': '3.0.0',
        },
      })

      // All plugins are public
      isPrivatePackageStub.resolves(false)

      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      expect(isPrivatePackageStub.callCount).to.equal(2)
      expect(isAuthenticatedStub.called).to.be.false
      expect(inquirerPromptStub.called).to.be.false
    })
  })

  describe('when private plugins are installed and user is authenticated', function () {
    it('should check plugins and return without prompting', async function () {
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@company/private-plugin': '1.0.0',
          '@oclif/plugin-help': '5.0.0',
        },
      })

      // First plugin is private, second is public
      isPrivatePackageStub.onFirstCall().resolves(true)
      isPrivatePackageStub.onSecondCall().resolves(false)
      isAuthenticatedStub.resolves(true)

      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      expect(isPrivatePackageStub.callCount).to.equal(2)
      expect(isAuthenticatedStub.calledOnce).to.be.true
      expect(inquirerPromptStub.called).to.be.false
    })
  })

  describe('when private plugins are installed and user is not authenticated', function () {
    it('should prompt user and call login when user accepts', async function () {
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@company/private-plugin': '1.0.0',
        },
      })

      isPrivatePackageStub.resolves(true)
      isAuthenticatedStub.resolves(false)
      inquirerPromptStub.resolves({shouldLogin: true})
      loginStub.resolves(true)

      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      expect(inquirerPromptStub.calledOnce).to.be.true
      expect(loginStub.calledOnce).to.be.true
      expect(uxWarnStub.called).to.be.true // Shows the warning banner
    })

    it('should warn and continue when user declines authentication', async function () {
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@company/private-plugin': '1.0.0',
        },
      })

      isPrivatePackageStub.resolves(true)
      isAuthenticatedStub.resolves(false)
      inquirerPromptStub.resolves({shouldLogin: false})

      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      expect(inquirerPromptStub.calledOnce).to.be.true
      expect(loginStub.called).to.be.false
      expect(uxWarnStub.callCount).to.equal(2) // Banner + decline message
    })
  })

  describe('batch processing', function () {
    it('should process plugins in batches of 5', async function () {
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          'plugin-1': '1.0.0',
          'plugin-2': '1.0.0',
          'plugin-3': '1.0.0',
          'plugin-4': '1.0.0',
          'plugin-5': '1.0.0',
          'plugin-6': '1.0.0',
          'plugin-7': '1.0.0',
        },
      })

      isPrivatePackageStub.resolves(false)

      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      // All 7 plugins should be checked
      expect(isPrivatePackageStub.callCount).to.equal(7)
    })

    it('should identify mix of private and public plugins', async function () {
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@company/private-1': '1.0.0',
          '@company/private-2': '1.0.0',
          '@heroku/plugin-cli': '8.0.0',
          '@oclif/plugin-help': '5.0.0',
        },
      })

      // Plugins 1 and 3 are private
      isPrivatePackageStub.callsFake(async (name: string) => name.startsWith('@company/'))
      isAuthenticatedStub.resolves(false)
      inquirerPromptStub.resolves({shouldLogin: false})

      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      expect(isPrivatePackageStub.callCount).to.equal(4)
      expect(inquirerPromptStub.calledOnce).to.be.true
      // Should show warning with both private plugins listed
      expect(uxWarnStub.called).to.be.true
    })
  })
})
