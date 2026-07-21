import {expect} from 'chai'
import * as sinon from 'sinon'
import {isTouchIdAvailable, requiresTouchIdAuth} from '../../../../src/lib/biometric/touch-id'

describe('Touch ID', () => {
  describe('requiresTouchIdAuth', () => {
    it('should return false for GET requests', () => {
      expect(requiresTouchIdAuth('GET')).to.be.false
      expect(requiresTouchIdAuth('get')).to.be.false
    })

    it('should return false for HEAD requests', () => {
      expect(requiresTouchIdAuth('HEAD')).to.be.false
      expect(requiresTouchIdAuth('head')).to.be.false
    })

    it('should return true for POST requests', () => {
      expect(requiresTouchIdAuth('POST')).to.be.true
      expect(requiresTouchIdAuth('post')).to.be.true
    })

    it('should return true for PUT requests', () => {
      expect(requiresTouchIdAuth('PUT')).to.be.true
      expect(requiresTouchIdAuth('put')).to.be.true
    })

    it('should return true for PATCH requests', () => {
      expect(requiresTouchIdAuth('PATCH')).to.be.true
      expect(requiresTouchIdAuth('patch')).to.be.true
    })

    it('should return true for DELETE requests', () => {
      expect(requiresTouchIdAuth('DELETE')).to.be.true
      expect(requiresTouchIdAuth('delete')).to.be.true
    })
  })

  describe('isTouchIdAvailable', () => {
    let platformStub: sinon.SinonStub

    beforeEach(() => {
      platformStub = sinon.stub(process, 'platform')
    })

    afterEach(() => {
      platformStub.restore()
    })

    it('should return false on non-macOS platforms', async () => {
      Object.defineProperty(process, 'platform', {value: 'linux', configurable: true})
      expect(await isTouchIdAvailable()).to.be.false

      Object.defineProperty(process, 'platform', {value: 'win32', configurable: true})
      expect(await isTouchIdAvailable()).to.be.false
    })

    // Note: Can't easily test macOS case without mocking child_process
    // which would require more complex test setup
  })
})
