/* eslint-env mocha */

import {expect} from 'chai'
import * as sinon from 'sinon'
import {EventEmitter} from 'node:events'
import {ux} from '@oclif/core'

import {NpmAuth} from '../../../src/lib/npm-auth.js'

describe('NpmAuth', function () {
  let execStub: sinon.SinonStub
  let spawnStub: sinon.SinonStub
  let uxStdoutStub: sinon.SinonStub
  let uxWarnStub: sinon.SinonStub

  beforeEach(function () {
    execStub = sinon.stub(NpmAuth, 'exec')
    spawnStub = sinon.stub(NpmAuth, 'spawn')
    uxStdoutStub = sinon.stub(ux, 'stdout')
    uxWarnStub = sinon.stub(ux, 'warn')
  })

  afterEach(function () {
    sinon.restore()
  })

  describe('isNpmAvailable', function () {
    it('should return true when npm is available', async function () {
      execStub.resolves({stdout: '8.0.0', stderr: ''})

      const result = await NpmAuth.isNpmAvailable()

      expect(result).to.be.true
      expect(execStub.calledOnce).to.be.true
    })

    it('should return false when npm is not available', async function () {
      execStub.rejects(new Error('command not found'))

      const result = await NpmAuth.isNpmAvailable()

      expect(result).to.be.false
    })
  })

  describe('isAuthenticated', function () {
    it('should return true when user is authenticated', async function () {
      execStub.resolves({stdout: 'username', stderr: ''})

      const result = await NpmAuth.isAuthenticated()

      expect(result).to.be.true
      expect(execStub.calledOnce).to.be.true
    })

    it('should return false when user is not authenticated', async function () {
      execStub.rejects(new Error('Not logged in'))

      const result = await NpmAuth.isAuthenticated()

      expect(result).to.be.false
    })
  })

  describe('isPrivatePackage', function () {
    it('should return false for public packages', async function () {
      execStub.resolves({stdout: '@oclif/core', stderr: ''})

      const result = await NpmAuth.isPrivatePackage('@oclif/core')

      expect(result).to.be.false
    })

    it('should return true when package returns 401', async function () {
      const error: any = new Error('401 Unauthorized')
      execStub.rejects(error)

      const result = await NpmAuth.isPrivatePackage('@private/package')

      expect(result).to.be.true
    })

    it('should return true when package returns 403', async function () {
      const error: any = new Error('403 Forbidden')
      execStub.rejects(error)

      const result = await NpmAuth.isPrivatePackage('@private/package')

      expect(result).to.be.true
    })

    it('should return true when package returns 404', async function () {
      const error: any = new Error('404 Not Found')
      execStub.rejects(error)

      const result = await NpmAuth.isPrivatePackage('@private/package')

      expect(result).to.be.true
    })

    it('should return true when error contains "authenticate"', async function () {
      const error: any = new Error('You need to authenticate')
      execStub.rejects(error)

      const result = await NpmAuth.isPrivatePackage('@private/package')

      expect(result).to.be.true
    })

    it('should return false for network errors', async function () {
      const error: any = new Error('ETIMEDOUT')
      execStub.rejects(error)

      const result = await NpmAuth.isPrivatePackage('@some/package')

      expect(result).to.be.false
    })
  })

  describe('login', function () {
    it('should return true when login succeeds and auth is verified', async function () {
      // Mock spawn for npm login
      const mockProcess = new EventEmitter()
      spawnStub.returns(mockProcess)

      // Mock exec for npm whoami
      execStub.resolves({stdout: 'username', stderr: ''})

      const loginPromise = NpmAuth.login()

      // Simulate successful exit
      setImmediate(() => mockProcess.emit('exit', 0))

      const result = await loginPromise

      expect(result).to.be.true
      expect(uxStdoutStub.calledWith('✓ Successfully authenticated with npm')).to.be.true
    })

    it('should return false when login command fails', async function () {
      const mockProcess = new EventEmitter()
      spawnStub.returns(mockProcess)

      const loginPromise = NpmAuth.login()

      // Simulate failed exit
      setImmediate(() => mockProcess.emit('exit', 1))

      const result = await loginPromise

      expect(result).to.be.false
      expect(uxWarnStub.called).to.be.true
    })

    it('should return false when login succeeds but verification fails', async function () {
      // Mock spawn for npm login succeeding
      const mockProcess = new EventEmitter()
      spawnStub.returns(mockProcess)

      // Mock exec for npm whoami failing
      execStub.rejects(new Error('Not logged in'))

      const loginPromise = NpmAuth.login()

      // Simulate successful exit
      setImmediate(() => mockProcess.emit('exit', 0))

      const result = await loginPromise

      expect(result).to.be.false
      expect(uxWarnStub.called).to.be.true
    })

    it('should return false when spawn error occurs', async function () {
      const mockProcess = new EventEmitter()
      spawnStub.returns(mockProcess)

      const loginPromise = NpmAuth.login()

      // Simulate error
      setImmediate(() => mockProcess.emit('error', new Error('spawn error')))

      const result = await loginPromise

      expect(result).to.be.false
      expect(uxWarnStub.called).to.be.true
    })
  })
})
