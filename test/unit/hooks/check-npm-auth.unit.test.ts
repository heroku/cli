/* eslint-env mocha */

import fs from 'fs-extra'
import * as os from 'node:os'
import * as path from 'node:path'

import checkNpmAuth from '../../../src/hooks/update/check-npm-auth.js'

describe('check-npm-auth hook', function () {
  let hookContext: any
  let testDataDir: string

  beforeEach(async function () {
    // Create a temporary directory for each test
    testDataDir = path.join(os.tmpdir(), `test-npm-auth-${Date.now()}`)
    await fs.ensureDir(testDataDir)

    hookContext = {
      config: {
        dataDir: testDataDir,
      },
      debug() {},
      error(msg: string, opts: any) {
        const error: any = new Error(msg)
        error.oclif = {exit: opts.exit}
        throw error
      },
    }
  })

  afterEach(async function () {
    // Clean up test directory
    await fs.remove(testDataDir)
  })

  describe('when no plugins are installed', function () {
    it('should return early', async function () {
      // Don't create package.json - no plugins installed
      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })

      // Should complete without error
    })
  })

  describe('when only public plugins are installed', function () {
    it('should return early without prompting', async function () {
      // Create package.json with only public plugins
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {
          '@oclif/plugin-help': '5.0.0',
        },
      })

      // Should complete without prompting
      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })
    })
  })

  describe('when no private plugins exist', function () {
    it('should skip authentication check entirely', async function () {
      // Create package.json with empty dependencies
      const packageJsonPath = path.join(testDataDir, 'package.json')
      await fs.outputJson(packageJsonPath, {
        dependencies: {},
      })

      // Should complete without prompting
      await checkNpmAuth.call(hookContext, {
        channel: 'stable',
        config: hookContext.config,
        context: {} as any,
        version: '11.0.0',
      })
    })
  })
})
