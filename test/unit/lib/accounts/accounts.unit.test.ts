import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sinon from 'sinon'

import AccountsModule from '../../../../src/lib/accounts/accounts.js'
import {stubCredentialManager} from '../../../helpers/credential-manager-stub.js'

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
    delete process.env.HEROKU_NATIVE_STORE_WRITE
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
      sinon.stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'keychain' as any, useNetrc: false})
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

    it('should not run if useNetrc is false', function () {
      sinon.stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'macos-keychain', useNetrc: false})
      AccountsModule.add('test-user', 'username123', 'password123')

      expect(mkdirSyncStub.calledOnce).to.be.false
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

  describe('set()', function () {
    describe('with credentialStore and no account name', function () {
      let writeLoginStateStub: sinon.SinonStub

      beforeEach(function () {
        sinon.stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'keychain' as any, useNetrc: false})
        writeLoginStateStub = sinon.stub(AccountsModule, 'writeLoginState').resolves()
      })

      it('calls writeLoginState with the dataDir and account username', async function () {
        const account = {username: 'user@example.com'}
        await AccountsModule.set(account, '/data/heroku')

        expect(writeLoginStateStub.calledOnce).to.be.true
        expect(writeLoginStateStub.firstCall.args[0]).to.equal('/data/heroku')
        expect(writeLoginStateStub.firstCall.args[1]).to.equal('user@example.com')
      })

      it('does not call writeLoginState when account has a name', async function () {
        const account = {name: 'my-account', username: 'user@example.com'}
        await AccountsModule.set(account, '/data/heroku')

        expect(writeLoginStateStub.called).to.be.false
      })
    })

    describe('with useNetrc and account name', function () {
      let fakeNetrc: {machines: Record<string, {login: string, password: string}>, save: sinon.SinonStub}

      function setNetrc(value: typeof fakeNetrc | undefined) {
        (AccountsModule as unknown as {netrc: typeof fakeNetrc | undefined}).netrc = value
      }

      beforeEach(function () {
        sinon.stub(AccountsModule, 'getStorageConfig').returns({credentialStore: null, useNetrc: true})
        fakeNetrc = {machines: {}, save: sinon.stub().resolves()}
        setNetrc(fakeNetrc)
        fsReadFileStub.withArgs(sinon.match(/my-account$/), 'utf8')
          .returns('username: user@example.com\npassword: secret\n')
      })

      afterEach(function () {
        setNetrc(null as unknown as typeof fakeNetrc)
      })

      it('writes credentials to api.heroku.com and git.heroku.com machines', async function () {
        const account = {name: 'my-account', username: 'user@example.com'}
        await AccountsModule.set(account, '/data/heroku')

        expect(fakeNetrc.machines['api.heroku.com']).to.deep.equal({login: 'user@example.com', password: 'secret'})
        expect(fakeNetrc.machines['git.heroku.com']).to.deep.equal({login: 'user@example.com', password: 'secret'})
      })

      it('saves the netrc file', async function () {
        const account = {name: 'my-account', username: 'user@example.com'}
        await AccountsModule.set(account, '/data/heroku')

        expect(fakeNetrc.save.calledOnce).to.be.true
      })

      it('does not update netrc when account has no name', async function () {
        const account = {username: 'user@example.com'}
        await AccountsModule.set(account, '/data/heroku')

        expect(fakeNetrc.save.called).to.be.false
      })
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

    it('should remove the account file with the given name', async function () {
      const accountName = 'test-account'
      const basedir = '/user/home'

      osHomeStub.returns(basedir)
      existsSyncStub.returns(false)

      await AccountsModule.remove(accountName)

      expect(unlinkStub.calledOnce).to.be.true
      expect(unlinkStub.firstCall.args[0]).to.equal(
        path.join(`${basedir}/.config/heroku/accounts`, accountName),
      )
    })

    it('should throw an error if the file cannot be removed', async function () {
      const accountName = 'non-existent-account'
      const error = new Error('File not found')
      unlinkStub.throws(error)

      await expect(AccountsModule.remove(accountName)).to.be.rejectedWith(Error)
    })

    describe('with credentialStore', function () {
      let credStub: ReturnType<typeof stubCredentialManager>
      let removeAuthStub: sinon.SinonStub

      beforeEach(function () {
        removeAuthStub = sinon.stub().resolves()
        credStub = stubCredentialManager({
          removeAuth: removeAuthStub,
        })
        sinon.stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'keychain' as any, useNetrc: false})
      })

      afterEach(function () {
        credStub.restore()
      })

      it('should call removeAuth with account name and hosts', async function () {
        const accountName = 'test-account@example.com'

        await AccountsModule.remove(accountName)

        expect(removeAuthStub.calledOnce).to.be.true
        expect(removeAuthStub.firstCall.args[0]).to.equal(accountName)
        expect(removeAuthStub.firstCall.args[1]).to.deep.equal(['api.heroku.com', 'git.heroku.com'])
      })

      it('should not call unlinkSync when credentialStore is set', async function () {
        const accountName = 'test-account@example.com'

        await AccountsModule.remove(accountName)

        expect(unlinkStub.called).to.be.false
      })

      it('should throw an error if removeAuth fails', async function () {
        const accountName = 'test-account@example.com'
        const error = new Error('Keychain removal failed')
        removeAuthStub.rejects(error)

        await expect(AccountsModule.remove(accountName)).to.be.rejectedWith('Keychain removal failed')
      })
    })
  })
})
