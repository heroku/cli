/* eslint-env mocha */
import {ux} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import sinon from 'sinon'

import checkPluginHealth from '../../../src/hooks/update/check-plugin-health.js'

describe('check-plugin-health hook', function () {
  let hookContext: any
  let testDataDir: string
  let warnStub: sinon.SinonStub
  let debugStub: sinon.SinonStub

  // Helper to create hook options
  const createHookOptions = (config: any) => ({
    channel: 'stable' as const,
    config,
    context: {} as any,
    version: '11.0.0',
  })

  beforeEach(async function () {
    // Create a temporary directory for each test
    testDataDir = path.join(os.tmpdir(), `test-plugin-health-${Date.now()}`)
    await fs.ensureDir(testDataDir)
    warnStub = sinon.stub(ux, 'warn')
    debugStub = sinon.stub()

    hookContext = {
      config: {
        dataDir: testDataDir,
      },
      debug: debugStub,
    }
  })

  afterEach(async function () {
    // Clean up test directory
    await fs.remove(testDataDir)
    sinon.restore()
  })

  describe('when no plugins package.json exists', function () {
    it('should not emit a warning message', async function () {
      // Don't create package.json - it doesn't exist
      await checkPluginHealth.call(hookContext, createHookOptions(hookContext.config))

      // Should not warn since there's nothing to check
      expect(warnStub.called).to.be.false
    })
  })

  describe('when plugins package.json is invalid', function () {
    it('should not emit a warning message', async function () {
      // Create invalid JSON file
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputFile(packageJsonPath, '{invalid json}')

      await checkPluginHealth.call(hookContext, createHookOptions(hookContext.config))

      // Should not warn (caught the parse error and returned early)
      expect(warnStub.called).to.be.false
    })
  })

  describe('when dependencies field is missing', function () {
    it('should not emit a warning message', async function () {
      // Create package.json without dependencies field
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {name: 'test'})

      await checkPluginHealth.call(hookContext, createHookOptions(hookContext.config))

      // Should not warn since there are no dependencies to check
      expect(warnStub.called).to.be.false
    })
  })

  describe('when no dependencies are configured', function () {
    it('should not emit a warning message', async function () {
      // Create package.json with empty dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {dependencies: {}})

      await checkPluginHealth.call(hookContext, createHookOptions(hookContext.config))

      // Should not warn since there are no dependencies
      expect(warnStub.called).to.be.false
    })
  })

  describe('when all plugins are installed', function () {
    it('should not emit a warning message', async function () {
      // Create package.json with dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@heroku-cli/plugin-api': '3.0.0',
          '@oclif/plugin-help': '5.0.0',
        },
      })

      // Create node_modules directories for both plugins
      await fs.ensureDir(path.join(testDataDir, 'node_modules', '@oclif', 'plugin-help'))
      await fs.ensureDir(path.join(testDataDir, 'node_modules', '@heroku-cli', 'plugin-api'))

      await checkPluginHealth.call(hookContext, createHookOptions(hookContext.config))

      expect(warnStub.called).to.be.false
    })
  })

  describe('when some plugins are missing', function () {
    it('should warn with recovery instructions', async function () {
      // Create package.json with dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@oclif/plugin-help': '5.0.0',
          'heroku-pg-extras': '1.0.0',
        },
      })

      // Only create one plugin directory
      await fs.ensureDir(path.join(testDataDir, 'node_modules', '@oclif', 'plugin-help'))
      // Don't create heroku-pg-extras - it's missing

      await checkPluginHealth.call(hookContext, createHookOptions(hookContext.config))

      expect(warnStub.calledOnce).to.be.true
      const warnMessage = warnStub.firstCall.args[0]
      const strippedMessage = ansis.strip(warnMessage)
      expect(strippedMessage).to.include('PLUGIN INSTALLATION INCOMPLETE')
      expect(strippedMessage).to.include('1 plugin(s) failed to install')
      expect(strippedMessage).to.include('heroku-pg-extras')
      expect(strippedMessage).to.include('heroku plugins:install heroku-pg-extras')
      expect(strippedMessage).to.include('heroku plugins:uninstall heroku-pg-extras')
    })
  })

  describe('when multiple plugins are missing', function () {
    it('should list all missing plugins', async function () {
      // Create package.json with dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@heroku-cli/plugin-api': '3.0.0',
          '@oclif/plugin-help': '5.0.0',
          'heroku-pg-extras': '1.0.0',
        },
      })

      // Only create one plugin directory
      await fs.ensureDir(path.join(testDataDir, 'node_modules', '@oclif', 'plugin-help'))
      // Don't create the other two - they're missing

      await checkPluginHealth.call(hookContext, createHookOptions(hookContext.config))

      expect(warnStub.calledOnce).to.be.true
      const warnMessage = warnStub.firstCall.args[0]
      expect(warnMessage).to.include('2 plugin(s) failed to install')
      expect(warnMessage).to.include('heroku-pg-extras')
      expect(warnMessage).to.include('@heroku-cli/plugin-api')
      expect(warnMessage).to.not.include('@oclif/plugin-help')
    })
  })

  describe('error handling', function () {
    it('should not throw and should warn when node_modules is a file', async function () {
      // Create package.json with dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          'test-plugin': '1.0.0',
        },
      })

      // Create node_modules as a file instead of directory
      // existsSync will return false for the plugin path, treating it as missing
      const nodeModulesPath = path.join(testDataDir, 'node_modules')
      await fs.outputFile(nodeModulesPath, 'this is a file not a directory')

      // Should not throw even in unusual scenarios
      await checkPluginHealth.call(hookContext, createHookOptions(hookContext.config))

      // The plugin should be reported as missing since node_modules/test-plugin doesn't exist
      expect(warnStub.calledOnce).to.be.true
      const warnMessage = warnStub.firstCall.args[0]
      expect(warnMessage).to.include('test-plugin')
    })
  })
})
