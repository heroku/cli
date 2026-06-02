import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import * as fs from 'fs-extra'
import os from 'node:os'
import {join} from 'node:path'
import {restore, SinonStub, stub} from 'sinon'

import {checkTos} from '../../../src/hooks/init/terms-of-service.js'

describe('terms-of-service hook', function () {
  let testCacheDir: string
  let tosPath: string
  let uxWarnStub: SinonStub

  beforeEach(async function () {
    // Create a temporary directory for each test
    testCacheDir = join(os.tmpdir(), `test-tos-${Date.now()}`)
    await fs.ensureDir(testCacheDir)
    tosPath = join(testCacheDir, 'terms-of-service')

    // Stub ux.warn
    uxWarnStub = stub(ux, 'warn')
  })

  afterEach(async function () {
    // Clean up test directory
    await fs.remove(testCacheDir)
    restore()
  })

  describe('has never run before', function () {
    it('warns of new terms of service', async function () {
      const options = {
        config: {
          cacheDir: testCacheDir,
        },
      }

      await checkTos(options)

      expect(uxWarnStub.calledOnce).to.be.true
      expect(uxWarnStub.firstCall.args[0]).to.contain('Our terms of service have changed')

      // Verify the file was created
      const fileExists = await fs.pathExists(tosPath)
      expect(fileExists).to.be.true
    })
  })

  describe('has run once before', function () {
    it('does not give a warning', async function () {
      // Create the file first to simulate having run before
      await fs.createFile(tosPath)

      const options = {
        config: {
          cacheDir: testCacheDir,
        },
      }

      await checkTos(options)

      expect(uxWarnStub.called).to.be.false
    })
  })
})
