/* eslint-env mocha */

import {expect} from 'chai'
import fs from 'fs-extra'
import * as path from 'node:path'
import * as os from 'node:os'
import ansis from 'ansis'
import checkPluginHealth from '../../../src/hooks/update/check-plugin-health.js'

describe('check-plugin-health hook', function () {
  let hookContext: any
  let testDataDir: string

  beforeEach(async function () {
    // Create a temporary directory for each test
    testDataDir = path.join(os.tmpdir(), `test-plugin-health-${Date.now()}`)
    await fs.ensureDir(testDataDir)

    hookContext = {
      config: {
        dataDir: testDataDir,
      },
      debug: () => {},
      warn: (msg: string) => {
        hookContext.warnMessage = msg
      },
      warnMessage: null,
    }
  })

  afterEach(async function () {
    // Clean up test directory
    await fs.remove(testDataDir)
  })

  describe('when no plugins package.json exists', function () {
    it('should return early', async function () {
      // Don't create package.json - it doesn't exist
      await checkPluginHealth.call(hookContext, {channel: 'stable', version: '11.0.0', config: hookContext.config, context: {} as any})

      expect(hookContext.warnMessage).to.be.null
    })
  })

  describe('when plugins package.json is invalid', function () {
    it('should return early', async function () {
      // Create invalid JSON file
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputFile(packageJsonPath, '{invalid json}')

      await checkPluginHealth.call(hookContext, {channel: 'stable', version: '11.0.0', config: hookContext.config, context: {} as any})

      expect(hookContext.warnMessage).to.be.null
    })
  })

  describe('when no dependencies are configured', function () {
    it('should return early', async function () {
      // Create package.json with empty dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {dependencies: {}})

      await checkPluginHealth.call(hookContext, {channel: 'stable', version: '11.0.0', config: hookContext.config, context: {} as any})

      expect(hookContext.warnMessage).to.be.null
    })
  })

  describe('when all plugins are installed', function () {
    it('should not warn', async function () {
      // Create package.json with dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@oclif/plugin-help': '5.0.0',
          '@heroku-cli/plugin-api': '3.0.0',
        },
      })

      // Create node_modules directories for both plugins
      await fs.ensureDir(path.join(testDataDir, 'node_modules', '@oclif', 'plugin-help'))
      await fs.ensureDir(path.join(testDataDir, 'node_modules', '@heroku-cli', 'plugin-api'))

      await checkPluginHealth.call(hookContext, {channel: 'stable', version: '11.0.0', config: hookContext.config, context: {} as any})

      expect(hookContext.warnMessage).to.be.null
    })
  })

  describe('when some plugins are missing', function () {
    it('should warn with recovery instructions', async function () {
      // Create package.json with dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@oclif/plugin-help': '5.0.0',
          '@heroku/sudo': '1.0.0',
        },
      })

      // Only create one plugin directory
      await fs.ensureDir(path.join(testDataDir, 'node_modules', '@oclif', 'plugin-help'))
      // Don't create @heroku/sudo - it's missing

      await checkPluginHealth.call(hookContext, {channel: 'stable', version: '11.0.0', config: hookContext.config, context: {} as any})

      expect(hookContext.warnMessage).to.not.be.null
      const strippedMessage = ansis.strip(hookContext.warnMessage)
      expect(strippedMessage).to.include('PLUGIN INSTALLATION INCOMPLETE')
      expect(strippedMessage).to.include('1 plugin(s) failed to install')
      expect(strippedMessage).to.include('@heroku/sudo')
      expect(strippedMessage).to.include('heroku plugins:install @heroku/sudo')
      expect(strippedMessage).to.include('heroku plugins:uninstall @heroku/sudo')
    })
  })

  describe('when multiple plugins are missing', function () {
    it('should list all missing plugins', async function () {
      // Create package.json with dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@heroku/sudo': '1.0.0',
          '@heroku-cli/plugin-api': '3.0.0',
          '@oclif/plugin-help': '5.0.0',
        },
      })

      // Only create one plugin directory
      await fs.ensureDir(path.join(testDataDir, 'node_modules', '@oclif', 'plugin-help'))
      // Don't create the other two - they're missing

      await checkPluginHealth.call(hookContext, {channel: 'stable', version: '11.0.0', config: hookContext.config, context: {} as any})

      expect(hookContext.warnMessage).to.not.be.null
      expect(hookContext.warnMessage).to.include('2 plugin(s) failed to install')
      expect(hookContext.warnMessage).to.include('@heroku/sudo')
      expect(hookContext.warnMessage).to.include('@heroku-cli/plugin-api')
      expect(hookContext.warnMessage).to.not.include('@oclif/plugin-help')
    })
  })

  describe('error handling', function () {
    it('should not throw when check fails', async function () {
      // Set dataDir to a path that will cause an error when reading
      // Create package.json but make node_modules check fail
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          'test-plugin': '1.0.0',
        },
      })

      // Create node_modules as a file instead of directory to cause an error
      const nodeModulesPath = path.join(testDataDir, 'node_modules')
      await fs.outputFile(nodeModulesPath, 'this is a file not a directory')

      // Should not throw even if there's an error checking
      await checkPluginHealth.call(hookContext, {channel: 'stable', version: '11.0.0', config: hookContext.config, context: {} as any})

      // The hook should handle the error gracefully
    })
  })
})
