import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  match, restore, SinonStub, stub,
} from 'sinon'

import AccountsModule from '../../../../src/lib/accounts/accounts.js'
import {stubCredentialManager} from '../../../helpers/credential-manager-stub.js'

describe('accounts', function () {
  let fsReaddirStub: SinonStub
  let fsReadFileStub: SinonStub

  beforeEach(function () {
    process.env.HEROKU_NETRC_WRITE = 'true'
    fsReaddirStub = stub(fs, 'readdirSync')
    fsReadFileStub = stub(fs, 'readFileSync')
  })

  afterEach(function () {
    delete process.env.HEROKU_NETRC_WRITE
    delete process.env.HEROKU_NATIVE_STORE_WRITE
    restore()
  })

  describe('list()', function () {
    it('should return an empty array when directory is not accessible', async function () {
      fsReaddirStub.throws(new Error('Directory not found'))
      const result = await AccountsModule.list()
      expect(result).to.be.an('array').that.is.empty
    })

    it('should return array of AccountEntry objects when files exist', async function () {
      fsReaddirStub.returns(['account1', 'account2'])
      fsReadFileStub.withArgs(match(/account1$/), 'utf8')
        .returns('username: user1\npassword: pass1\n')
      fsReadFileStub.withArgs(match(/account2$/), 'utf8')
        .returns('username: user2\npassword: pass2\n')

      const result = await AccountsModule.list()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.deep.equal({name: 'account1', username: 'user1'})
      expect(result[1]).to.deep.equal({name: 'account2', username: 'user2'})
    })

    it('should handle ruby-style symbol keys', async function () {
      fsReaddirStub.returns(['account1'])
      fsReadFileStub.withArgs(match(/account1$/), 'utf8')
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
      stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'keychain' as any, useNetrc: false})
    })

    it('should return AccountEntry objects with only username when credentialStore is set', async function () {
      stub(AccountsModule, 'getKeychainAccounts').resolves(['user1@example.com', 'user2@example.com'])

      const result = await AccountsModule.list()

      expect(result).to.be.an('array').that.has.lengthOf(2)
      expect(result[0]).to.deep.equal({username: 'user1@example.com'})
      expect(result[1]).to.deep.equal({username: 'user2@example.com'})
    })

    it('should return an empty array when the keychain has no accounts', async function () {
      stub(AccountsModule, 'getKeychainAccounts').resolves([])

      const result = await AccountsModule.list()

      expect(result).to.be.an('array').that.is.empty
    })

    it('should filter out null and undefined keychain entries', async function () {
      stub(AccountsModule, 'getKeychainAccounts').resolves(['user1@example.com', null, undefined, 'user2@example.com'])

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
      fsReadFileStub.withArgs(match(/account1$/), 'utf8')
        .returns('username: user1\npassword: pass1\n')
      fsReadFileStub.withArgs(match(/account2$/), 'utf8')
        .returns('username: user2\npassword: pass2\n')

      const result = AccountsModule.listNetrc()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.deep.equal({name: 'account1', username: 'user1'})
      expect(result[1]).to.deep.equal({name: 'account2', username: 'user2'})
    })
  })

  describe('add', function () {
    let mkdirSyncStub: SinonStub
    let writeFileSyncStub: SinonStub
    let chmodSyncStub: SinonStub

    beforeEach(function () {
      mkdirSyncStub = stub(fs, 'mkdirSync')
      writeFileSyncStub = stub(fs, 'writeFileSync')
      chmodSyncStub = stub(fs, 'chmodSync')
    })

    it('should not run if useNetrc is false', function () {
      stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'macos-keychain', useNetrc: false})
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
      let writeLoginStateStub: SinonStub

      beforeEach(function () {
        stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'keychain' as any, useNetrc: false})
        writeLoginStateStub = stub(AccountsModule, 'writeLoginState').resolves()
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
      let fakeNetrc: {machines: Record<string, {login: string, password: string}>, save: SinonStub}

      function setNetrc(value: typeof fakeNetrc | undefined) {
        (AccountsModule as unknown as {netrc: typeof fakeNetrc | undefined}).netrc = value
      }

      beforeEach(function () {
        stub(AccountsModule, 'getStorageConfig').returns({credentialStore: null, useNetrc: true})
        fakeNetrc = {machines: {}, save: stub().resolves()}
        setNetrc(fakeNetrc)
        fsReadFileStub.withArgs(match(/my-account$/), 'utf8')
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

  describe('currentNetrc()', function () {
    let fakeNetrc: {machines: Record<string, {login: string, password: string}>, save: SinonStub}

    function setNetrc(value: typeof fakeNetrc | undefined) {
      (AccountsModule as unknown as {netrc: typeof fakeNetrc | undefined}).netrc = value
    }

    beforeEach(function () {
      fakeNetrc = {machines: {}, save: stub().resolves()}
      setNetrc(fakeNetrc)
      fsReadFileStub.withArgs(match(/my-account$/), 'utf8')
        .returns('username: user@example.com\npassword: secret\n')
      fsReaddirStub.returns(['my-account', 'other-account'])
      fsReadFileStub.withArgs(match(/other-account$/), 'utf8')
        .returns('username: other@example.com\npassword: secret\n')
    })

    afterEach(function () {
      setNetrc(null as unknown as typeof fakeNetrc)
    })

    it('returns account name when api.heroku.com machine exists and matches', async function () {
      fakeNetrc.machines['api.heroku.com'] = {login: 'user@example.com', password: 'secret'}

      const result = await AccountsModule.currentNetrc()

      expect(result).to.equal('my-account')
    })

    it('returns null when api.heroku.com machine does not exist', async function () {
      const result = await AccountsModule.currentNetrc()

      expect(result).to.equal(null)
    })

    it('returns null when no account matches the login', async function () {
      fakeNetrc.machines['api.heroku.com'] = {login: 'nomatch@example.com', password: 'secret'}

      const result = await AccountsModule.currentNetrc()

      expect(result).to.equal(null)
    })
  })

  describe('removeNetrc()', function () {
    let unlinkStub: SinonStub
    let osHomeStub: SinonStub
    let existsSyncStub: SinonStub

    beforeEach(function () {
      unlinkStub = stub(fs, 'unlinkSync')
      osHomeStub = stub(os, 'homedir')
      existsSyncStub = stub(fs, 'existsSync')
    })

    it('should remove the account file with the given name', function () {
      const accountName = 'test-account'
      const basedir = '/user/home'

      osHomeStub.returns(basedir)
      existsSyncStub.returns(false)

      AccountsModule.removeNetrc(accountName)

      expect(unlinkStub.calledOnce).to.be.true
      expect(unlinkStub.firstCall.args[0]).to.equal(path.join(`${basedir}/.config/heroku/accounts`, accountName))
    })

    it('should throw an error if the file cannot be removed', function () {
      const accountName = 'non-existent-account'
      const error = new Error('File not found')
      unlinkStub.throws(error)

      expect(() => AccountsModule.removeNetrc(accountName)).to.throw(Error)
    })
  })

  describe('remove', function () {
    let removeNetrcStub: SinonStub

    beforeEach(function () {
      removeNetrcStub = stub(AccountsModule, 'removeNetrc')
    })

    it('should call removeNetrc when no credential store', async function () {
      const accountName = 'test-account'

      await AccountsModule.remove(accountName)

      expect(removeNetrcStub.calledOnce).to.be.true
      expect(removeNetrcStub.firstCall.args[0]).to.equal(accountName)
    })

    describe('with credentialStore', function () {
      let credStub: ReturnType<typeof stubCredentialManager>
      let removeAuthStub: SinonStub

      beforeEach(function () {
        removeAuthStub = stub().resolves()
        credStub = stubCredentialManager({
          removeAuth: removeAuthStub,
        })
        stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'keychain' as any, useNetrc: false})
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

      it('should not call removeNetrc when credentialStore is set', async function () {
        const accountName = 'test-account@example.com'

        await AccountsModule.remove(accountName)

        expect(removeNetrcStub.called).to.be.false
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
