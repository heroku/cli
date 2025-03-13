import {expect} from 'chai'
import * as fs from 'fs'
import * as sinon from 'sinon'
import netrc from 'netrc-parser'
import * as accounts from '../../../../src/lib/accounts/accounts'
import * as path from 'node:path'
import * as os from 'node:os'
import * as yaml from 'yaml'

const netrcFile = {
  machines: {
    'api.heroku.com': {
      login: 'user1',
      password: 'XXXXX',
    },
    'git.heroku.com': {
      login: 'user2',
      password: 'XXXXX',
    },
  },
  saveSync: sinon.stub(),
}

describe('accounts', function () {
  let fsReaddirStub: sinon.SinonStub
  let fsReadFileStub: sinon.SinonStub
  let netrcLoadSyncStub: sinon.SinonStub

  beforeEach(function () {
    // Setup stubs before each test
    fsReaddirStub = sinon.stub(fs, 'readdirSync')
    fsReadFileStub = sinon.stub(fs, 'readFileSync')
    netrcLoadSyncStub = sinon.stub(netrc, 'loadSync')
  })

  afterEach(function () {
    // Restore stubs after each test
    sinon.restore()
  })

  describe('list()', function () {
    it('should return an empty array when directory is not accessible', function () {
      fsReaddirStub.throws(new Error('Directory not found'))
      const result = accounts.list()
      expect(result).to.be.an('array').that.is.empty
    })

    it('should return array of account objects when files exist', function () {
      fsReaddirStub.returns(['account1', 'account2'])
      fsReadFileStub.withArgs(sinon.match(/account1$/), 'utf8')
        .returns('{"username": "user1", "password": "pass1"}')
      fsReadFileStub.withArgs(sinon.match(/account2$/), 'utf8')
        .returns('{"username": "user2", "password": "pass2"}')

      const result = accounts.list()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.deep.include({
        name: 'account1',
        username: 'user1',
        password: 'pass1',
      })
      expect(result[1]).to.deep.include({
        name: 'account2',
        username: 'user2',
        password: 'pass2',
      })
    })

    it('should handle ruby-style symbol keys', function () {
      fsReaddirStub.returns(['account1'])
      fsReadFileStub.withArgs(sinon.match(/account1$/), 'utf8')
        .returns('{":username": "user1", ":password": "pass1"}')

      const result = accounts.list()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.deep.include({
        name: 'account1',
        username: 'user1',
        password: 'pass1',
      })
      expect(result[0]).to.not.have.property(':username')
      expect(result[0]).to.not.have.property(':password')
    })
  })

  describe('accounts.current()', function () {
    it('should return null when no api.heroku.com machine exists', function () {
      netrcLoadSyncStub.returns({machines: {}})

      const result = accounts.current()
      expect(result).to.be.null
    })

    it('should return null when username does not match any account', function () {
      netrcLoadSyncStub.returns(netrcFile)

      sinon.stub(accounts, 'list').returns([])

      const result = accounts.current()
      expect(result).to.be.null
    })

    it('should return account name when username matches', function () {
      netrcLoadSyncStub.returns(netrcFile)
      fsReaddirStub.returns(['account1', 'account2'])
      fsReadFileStub.withArgs(sinon.match(/account1$/), 'utf8')
        .returns('{"username": "user1", "password": "pass1"}')
      fsReadFileStub.withArgs(sinon.match(/account2$/), 'utf8')
        .returns('{"username": "user2", "password": "pass2"}')

      const result = accounts.current()
      expect(result).to.equal('account1')
    })
  })

  describe('add', function () {
    let mkdirSyncStub: sinon.SinonStub
    let writeFileSyncStub: sinon.SinonStub
    let chmodSyncStub: sinon.SinonStub

    beforeEach(function () {
      // Setup stubs before each test
      mkdirSyncStub = sinon.stub(fs, 'mkdirSync')
      writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
      chmodSyncStub = sinon.stub(fs, 'chmodSync')
    })

    it('should create directory with recursive option', function () {
      accounts.add('test-user', 'username123', 'password123')

      expect(mkdirSyncStub.calledOnce).to.be.true
      expect(mkdirSyncStub.firstCall.args[1]).to.deep.equal({recursive: true})
    })

    it('should write credentials to file with correct format', function () {
      const testName = 'test-user'
      const testUsername = 'username123'
      const testPassword = 'password123'

      accounts.add(testName, testUsername, testPassword)

      expect(writeFileSyncStub.calledOnce).to.be.true
      expect(writeFileSyncStub.firstCall.args[1]).to.equal('username: username123\npassword: password123\n')
      expect(writeFileSyncStub.firstCall.args[2]).to.equal('utf8')
    })

    it('should set correct file permissions', function () {
      const testName = 'test-user'

      accounts.add(testName, 'username123', 'password123')

      expect(chmodSyncStub.calledOnce).to.be.true
      expect(chmodSyncStub.firstCall.args[1]).to.equal(0o600)
    })

    it('should throw error if directory creation fails', function () {
      mkdirSyncStub.throws(new Error('Directory creation failed'))

      expect(() => accounts.add('test-user', 'username123', 'password123')).to.throw()
    })
  })

  describe('remove', function () {
    let unlinkStub: sinon.SinonStub
    let osHomeStub: sinon.SinonStub
    let existsSyncStub: sinon.SinonStub

    beforeEach(function () {
      // Create a stub for fs.unlinkSync before each test
      unlinkStub = sinon.stub(fs, 'unlinkSync')
      osHomeStub = sinon.stub(os, 'homedir')
      existsSyncStub = sinon.stub(fs, 'existsSync')
    })

    it('should remove the account file with the given name', function () {
      const accountName = 'test-account'
      const basedir = '/user/home'

      osHomeStub.returns(basedir)
      existsSyncStub.returns(false)

      accounts.remove(accountName)

      expect(unlinkStub.calledOnce).to.be.true
      expect(unlinkStub.firstCall.args[0]).to.equal(
        path.join(`${basedir}/.config/heroku/accounts`, accountName),
      )
    })

    it('should throw an error if the file cannot be removed', function () {
      const accountName = 'non-existent-account'
      const error = new Error('File not found')
      unlinkStub.throws(error)

      expect(() => accounts.remove(accountName)).to.throw(Error)
    })
  })

  describe('set', function () {
    beforeEach(function () {
      // Setup stubs before each test
      netrcLoadSyncStub.returns(netrcFile)
      fsReaddirStub.returns(['account1', 'account2'])
      fsReadFileStub.withArgs(sinon.match(/account1$/), 'utf8')
        .returns('{"username": "user1", "password": "pass1"}')
      fsReadFileStub.withArgs(sinon.match(/account2$/), 'utf8')
        .returns('{"username": "user2", "password": "pass2"}')
      sinon.stub(yaml, 'parse').returns('account1')
    })

    it('should call saveSync to persist changes', function () {
      const accountName = 'test-account'

      accounts.set(accountName)

      expect(netrcFile.saveSync.called).to.be.true
    })
  })
})
