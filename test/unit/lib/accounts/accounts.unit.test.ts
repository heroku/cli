import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sinon from 'sinon'

import AccountsModule from '../../../../src/lib/accounts/accounts.js'

describe('accounts', function () {
  let fsReaddirStub: sinon.SinonStub
  let fsReadFileStub: sinon.SinonStub

  beforeEach(function () {
    process.env.HEROKU_NETRC_WRITE = 'true'
    fsReaddirStub = sinon.stub(fs, 'readdirSync')
    fsReadFileStub = sinon.stub(fs, 'readFileSync')
  })

  afterEach(function () {
    delete process.env.HEROKU_NETRC_WRITE
    sinon.restore()
  })

  describe('list()', function () {
    it('should return an empty array when directory is not accessible', async function () {
      fsReaddirStub.throws(new Error('Directory not found'))
      const result = await AccountsModule.list()
      expect(result).to.be.an('array').that.is.empty
    })

    it('should return array of AccountEntry objects when files exist', async function () {
      fsReaddirStub.returns(['account1', 'account2'])
      fsReadFileStub.withArgs(sinon.match(/account1$/), 'utf8')
        .returns('username: user1\npassword: pass1\n')
      fsReadFileStub.withArgs(sinon.match(/account2$/), 'utf8')
        .returns('username: user2\npassword: pass2\n')

      const result = await AccountsModule.list()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.deep.equal({name: 'account1', username: 'user1'})
      expect(result[1]).to.deep.equal({name: 'account2', username: 'user2'})
    })

    it('should handle ruby-style symbol keys', async function () {
      fsReaddirStub.returns(['account1'])
      fsReadFileStub.withArgs(sinon.match(/account1$/), 'utf8')
        .returns('{":username": "user1", ":password": "pass1"}')

      const result = await AccountsModule.list()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.deep.equal({name: 'account1', username: 'user1'})
    })
  })

  describe('list() with credentialStore', function () {
    beforeEach(function () {
      delete process.env.HEROKU_NETRC_WRITE
    })

    it('should return AccountEntry objects with only username when credentialStore is set', async function () {
      sinon.stub(AccountsModule, 'getKeychainAccounts').resolves(['user1@example.com', 'user2@example.com'])

      const result = await AccountsModule.list()

      expect(result).to.be.an('array').that.has.lengthOf(2)
      expect(result[0]).to.deep.equal({username: 'user1@example.com'})
      expect(result[1]).to.deep.equal({username: 'user2@example.com'})
    })

    it('should return an empty array when the keychain has no accounts', async function () {
      sinon.stub(AccountsModule, 'getKeychainAccounts').resolves([])

      const result = await AccountsModule.list()

      expect(result).to.be.an('array').that.is.empty
    })

    it('should filter out null and undefined keychain entries', async function () {
      sinon.stub(AccountsModule, 'getKeychainAccounts').resolves(['user1@example.com', null, undefined, 'user2@example.com'])

      const result = await AccountsModule.list()

      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.deep.equal({username: 'user1@example.com'})
      expect(result[1]).to.deep.equal({username: 'user2@example.com'})
    })
  })

  describe('listNetrc()', function () {
    it('should return an empty array when directory is not accessible', function () {
      fsReaddirStub.throws(new Error('Directory not found'))
      const result = AccountsModule.listNetrc()
      expect(result).to.be.an('array').that.is.empty
    })

    it('should return array of AccountEntry objects with name and username', function () {
      fsReaddirStub.returns(['account1', 'account2'])
      fsReadFileStub.withArgs(sinon.match(/account1$/), 'utf8')
        .returns('username: user1\npassword: pass1\n')
      fsReadFileStub.withArgs(sinon.match(/account2$/), 'utf8')
        .returns('username: user2\npassword: pass2\n')

      const result = AccountsModule.listNetrc()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.deep.equal({name: 'account1', username: 'user1'})
      expect(result[1]).to.deep.equal({name: 'account2', username: 'user2'})
    })
  })

  describe('add', function () {
    let mkdirSyncStub: sinon.SinonStub
    let writeFileSyncStub: sinon.SinonStub
    let chmodSyncStub: sinon.SinonStub

    beforeEach(function () {
      mkdirSyncStub = sinon.stub(fs, 'mkdirSync')
      writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
      chmodSyncStub = sinon.stub(fs, 'chmodSync')
    })

    it('should create directory with recursive option', function () {
      AccountsModule.add('test-user', 'username123', 'password123')

      expect(mkdirSyncStub.calledOnce).to.be.true
      expect(mkdirSyncStub.firstCall.args[1]).to.deep.equal({recursive: true})
    })

    it('should write credentials to file with correct format', function () {
      AccountsModule.add('test-user', 'username123', 'password123')

      expect(writeFileSyncStub.calledOnce).to.be.true
      expect(writeFileSyncStub.firstCall.args[1]).to.equal('username: username123\npassword: password123\n')
      expect(writeFileSyncStub.firstCall.args[2]).to.equal('utf8')
    })

    it('should set correct file permissions', function () {
      AccountsModule.add('test-user', 'username123', 'password123')

      expect(chmodSyncStub.calledOnce).to.be.true
      expect(chmodSyncStub.firstCall.args[1]).to.equal(0o600)
    })

    it('should throw error if directory creation fails', function () {
      mkdirSyncStub.throws(new Error('Directory creation failed'))

      expect(() => AccountsModule.add('test-user', 'username123', 'password123')).to.throw()
    })
  })

  describe('remove', function () {
    let unlinkStub: sinon.SinonStub
    let osHomeStub: sinon.SinonStub
    let existsSyncStub: sinon.SinonStub

    beforeEach(function () {
      unlinkStub = sinon.stub(fs, 'unlinkSync')
      osHomeStub = sinon.stub(os, 'homedir')
      existsSyncStub = sinon.stub(fs, 'existsSync')
    })

    it('should remove the account file with the given name', function () {
      const accountName = 'test-account'
      const basedir = '/user/home'

      osHomeStub.returns(basedir)
      existsSyncStub.returns(false)

      AccountsModule.remove(accountName)

      expect(unlinkStub.calledOnce).to.be.true
      expect(unlinkStub.firstCall.args[0]).to.equal(
        path.join(`${basedir}/.config/heroku/accounts`, accountName),
      )
    })

    it('should throw an error if the file cannot be removed', function () {
      const accountName = 'non-existent-account'
      const error = new Error('File not found')
      unlinkStub.throws(error)

      expect(() => AccountsModule.remove(accountName)).to.throw(Error)
    })
  })
})