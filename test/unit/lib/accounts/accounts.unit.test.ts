import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
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
    let existsSyncStub: SinonStub

    beforeEach(function () {
      delete process.env.HEROKU_NETRC_WRITE
      stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'keychain' as any, useNetrc: false})
      existsSyncStub = stub(fs, 'existsSync')
    })

    it('should return an empty array when directory is not accessible', function () {
      fsReaddirStub.throws(new Error('Directory not found'))
      const result = AccountsModule.list()
      expect(result).to.be.an('array').that.is.empty
    })

    it('should return array of AccountEntry objects when files exist', function () {
      fsReaddirStub.returns(['account1', 'account2'])
      fsReadFileStub.withArgs(match(/account1$/), 'utf8')
        .returns('username: user1\npassword: pass1\n')
      fsReadFileStub.withArgs(match(/account2$/), 'utf8')
        .returns('username: user2\npassword: pass2\n')

      const result = AccountsModule.list()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(2)
      expect(result[0]).to.deep.equal({name: 'account1', username: 'user1'})
      expect(result[1]).to.deep.equal({name: 'account2', username: 'user2'})
    })

    it('should handle ruby-style symbol keys', function () {
      fsReaddirStub.returns(['account1'])
      fsReadFileStub.withArgs(match(/account1$/), 'utf8')
        .returns('{":username": "user1", ":password": "pass1"}')

      const result = AccountsModule.list()

      expect(result).to.be.an('array')
      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.deep.equal({name: 'account1', username: 'user1'})
    })

    it('should filter out files without username field', function () {
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      fsReaddirStub.returns(['valid', 'invalid'])
      fsReadFileStub.withArgs(match(/valid$/), 'utf8')
        .returns('username: valid@example.com\n')
      fsReadFileStub.withArgs(match(/invalid$/), 'utf8')
        .returns('other_field: value\n')

      const result = AccountsModule.list()

      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.deep.equal({name: 'valid', username: 'valid@example.com'})
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
    describe('with credentialStore', function () {
      let writeLoginStateStub: SinonStub
      let existsSyncStub: SinonStub
      let osHomeStub: SinonStub

      beforeEach(function () {
        stub(AccountsModule, 'getStorageConfig').returns({credentialStore: 'keychain' as any, useNetrc: false})
        writeLoginStateStub = stub(AccountsModule, 'writeLoginState').resolves()
        existsSyncStub = stub(fs, 'existsSync')
        osHomeStub = stub(os, 'homedir').returns('/user/home')
      })

      it('calls writeLoginState with username for non-aliased account', async function () {
        const account = {username: 'user@example.com'}
        await AccountsModule.set(account, '/data/heroku')

        expect(writeLoginStateStub.calledOnce).to.be.true
        expect(writeLoginStateStub.firstCall.args[0]).to.equal('/data/heroku')
        expect(writeLoginStateStub.firstCall.args[1]).to.equal('user@example.com')
      })

      it('calls writeLoginState with email from alias file for aliased account', async function () {
        const account = {name: 'production', username: 'prod@example.com'}
        existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
        existsSyncStub.withArgs(match(/production$/)).returns(true)
        fsReadFileStub.withArgs(match(/production$/), 'utf8')
          .returns('username: prod@example.com\n')

        await AccountsModule.set(account, '/data/heroku')

        expect(writeLoginStateStub.calledOnce).to.be.true
        expect(writeLoginStateStub.firstCall.args[0]).to.equal('/data/heroku')
        expect(writeLoginStateStub.firstCall.args[1]).to.equal('prod@example.com')
      })

      it('throws error when alias file does not exist', async function () {
        const account = {name: 'nonexistent', username: 'user@example.com'}
        existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
        existsSyncStub.withArgs(match(/nonexistent$/)).returns(false)

        await expect(AccountsModule.set(account, '/data/heroku'))
          .to.be.rejectedWith('We can\'t find the alias file for nonexistent.')
      })

      it('writes email to login.json not alias name', async function () {
        const account = {name: 'production', username: 'prod@example.com'}
        existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
        existsSyncStub.withArgs(match(/production$/)).returns(true)
        fsReadFileStub.withArgs(match(/production$/), 'utf8')
          .returns('username: prod@example.com\n')

        await AccountsModule.set(account, '/data/heroku')

        // Verify it writes EMAIL not alias
        expect(writeLoginStateStub.firstCall.args[1]).to.equal('prod@example.com')
        expect(writeLoginStateStub.firstCall.args[1]).to.not.equal('production')
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

      it('handles alias file without password (created in keychain mode)', async function () {
        fsReadFileStub.withArgs(match(/keychain-alias$/), 'utf8')
          .returns('username: user@example.com\n')
        const account = {name: 'keychain-alias', username: 'user@example.com'}
        await AccountsModule.set(account, '/data/heroku')

        expect(fakeNetrc.machines['api.heroku.com']).to.deep.equal({login: 'user@example.com', password: ''})
        expect(fakeNetrc.machines['git.heroku.com']).to.deep.equal({login: 'user@example.com', password: ''})
        expect(fakeNetrc.save.calledOnce).to.be.true
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

  describe('getAliasEmail()', function () {
    let existsSyncStub: SinonStub
    let osHomeStub: SinonStub

    beforeEach(function () {
      existsSyncStub = stub(fs, 'existsSync')
      osHomeStub = stub(os, 'homedir').returns('/user/home')
    })

    it('should return email when valid alias file exists', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      existsSyncStub.withArgs(match(/production$/)).returns(true)
      fsReadFileStub.withArgs(match(/production$/), 'utf8')
        .returns('username: user@example.com\n')

      const email = (AccountsModule as any).getAliasEmail('production')

      expect(email).to.equal('user@example.com')
    })

    it('should return undefined when alias file does not exist', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      existsSyncStub.withArgs(match(/nonexistent$/)).returns(false)

      const email = (AccountsModule as any).getAliasEmail('nonexistent')

      expect(email).to.be.undefined
    })

    it('should handle ruby-style symbol keys', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      existsSyncStub.withArgs(match(/legacy$/)).returns(true)
      fsReadFileStub.withArgs(match(/legacy$/), 'utf8')
        .returns('{":username": "legacy@example.com"}')

      const email = (AccountsModule as any).getAliasEmail('legacy')

      expect(email).to.equal('legacy@example.com')
    })

    it('should return undefined when file exists but username is missing', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      existsSyncStub.withArgs(match(/invalid$/)).returns(true)
      fsReadFileStub.withArgs(match(/invalid$/), 'utf8')
        .returns('other_field: value\n')

      const email = (AccountsModule as any).getAliasEmail('invalid')

      expect(email).to.be.undefined
    })

    it('should return undefined when file is malformed', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      existsSyncStub.withArgs(match(/malformed$/)).returns(true)
      fsReadFileStub.withArgs(match(/malformed$/), 'utf8')
        .throws(new Error('Parse error'))

      const email = (AccountsModule as any).getAliasEmail('malformed')

      expect(email).to.be.undefined
    })

    it('should use legacy .heroku directory when it exists', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.heroku').returns(true)
      existsSyncStub.withArgs(match(/production$/)).returns(true)
      fsReadFileStub.withArgs(match(/production$/), 'utf8')
        .returns('username: user@example.com\n')

      const email = (AccountsModule as any).getAliasEmail('production')

      expect(email).to.equal('user@example.com')
    })
  })

  describe('listAliasFiles()', function () {
    let existsSyncStub: SinonStub
    let osHomeStub: SinonStub

    beforeEach(function () {
      existsSyncStub = stub(fs, 'existsSync')
      osHomeStub = stub(os, 'homedir').returns('/user/home')
    })

    it('should return empty Map when directory does not exist', function () {
      existsSyncStub.returns(false)
      fsReaddirStub.throws(new Error('Directory not found'))

      const aliasMap = (AccountsModule as any).listAliasFiles()

      expect(aliasMap).to.be.instanceof(Map)
      expect(aliasMap.size).to.equal(0)
    })

    it('should return empty Map when directory is empty', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      fsReaddirStub.returns([])

      const aliasMap = (AccountsModule as any).listAliasFiles()

      expect(aliasMap).to.be.instanceof(Map)
      expect(aliasMap.size).to.equal(0)
    })

    it('should return Map with valid alias files', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      existsSyncStub.withArgs(match(/production$/)).returns(true)
      existsSyncStub.withArgs(match(/staging$/)).returns(true)
      fsReaddirStub.returns(['production', 'staging'])
      fsReadFileStub.withArgs(match(/production$/), 'utf8')
        .returns('username: prod@example.com\n')
      fsReadFileStub.withArgs(match(/staging$/), 'utf8')
        .returns('username: stage@example.com\n')

      const aliasMap = (AccountsModule as any).listAliasFiles()

      expect(aliasMap).to.be.instanceof(Map)
      expect(aliasMap.size).to.equal(2)
      expect(aliasMap.get('production')).to.equal('prod@example.com')
      expect(aliasMap.get('staging')).to.equal('stage@example.com')
    })

    it('should skip invalid files and return only valid entries', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      existsSyncStub.withArgs(match(/production$/)).returns(true)
      existsSyncStub.withArgs(match(/invalid$/)).returns(true)
      fsReaddirStub.returns(['production', 'invalid'])
      fsReadFileStub.withArgs(match(/production$/), 'utf8')
        .returns('username: prod@example.com\n')
      fsReadFileStub.withArgs(match(/invalid$/), 'utf8')
        .returns('other_field: value\n')

      const aliasMap = (AccountsModule as any).listAliasFiles()

      expect(aliasMap).to.be.instanceof(Map)
      expect(aliasMap.size).to.equal(1)
      expect(aliasMap.get('production')).to.equal('prod@example.com')
      expect(aliasMap.has('invalid')).to.be.false
    })

    it('should handle files with parse errors gracefully', function () {
      existsSyncStub.returns(false)
      existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
      existsSyncStub.withArgs(match(/production$/)).returns(true)
      existsSyncStub.withArgs(match(/malformed$/)).returns(true)
      fsReaddirStub.returns(['production', 'malformed'])
      fsReadFileStub.withArgs(match(/production$/), 'utf8')
        .returns('username: prod@example.com\n')
      fsReadFileStub.withArgs(match(/malformed$/), 'utf8')
        .throws(new Error('Parse error'))

      const aliasMap = (AccountsModule as any).listAliasFiles()

      expect(aliasMap).to.be.instanceof(Map)
      expect(aliasMap.size).to.equal(1)
      expect(aliasMap.get('production')).to.equal('prod@example.com')
    })
  })

  describe('remove', function () {
    let unlinkStub: SinonStub
    let osHomeStub: SinonStub
    let existsSyncStub: SinonStub

    beforeEach(function () {
      unlinkStub = stub(fs, 'unlinkSync')
      osHomeStub = stub(os, 'homedir').returns('/user/home')
      existsSyncStub = stub(fs, 'existsSync')
    })

    it('should remove the alias file when no credential store', async function () {
      const accountName = 'test-account'
      existsSyncStub.returns(false)

      await AccountsModule.remove(accountName)

      expect(unlinkStub.calledOnce).to.be.true
      expect(unlinkStub.firstCall.args[0]).to.match(/test-account$/)
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

      it('should remove account from keychain and delete alias file', async function () {
        const alias = 'production'
        existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
        existsSyncStub.withArgs(match(/production$/)).returns(true)
        fsReadFileStub.withArgs(match(/production$/), 'utf8')
          .returns('username: prod@example.com\n')

        await AccountsModule.remove(alias)

        expect(removeAuthStub.calledOnce).to.be.true
        expect(removeAuthStub.firstCall.args[0]).to.equal('prod@example.com')
        expect(removeAuthStub.firstCall.args[1]).to.deep.equal(['api.heroku.com', 'git.heroku.com'])
        expect(unlinkStub.calledOnce).to.be.true
        expect(unlinkStub.firstCall.args[0]).to.match(/production$/)
      })

      it('should throw an error if removeAuth fails', async function () {
        const alias = 'production'
        existsSyncStub.withArgs('/user/home/.config/heroku').returns(false)
        existsSyncStub.withArgs(match(/production$/)).returns(true)
        fsReadFileStub.withArgs(match(/production$/), 'utf8')
          .returns('username: prod@example.com\n')
        const error = new Error('Keychain removal failed')
        removeAuthStub.rejects(error)

        await expect(AccountsModule.remove(alias)).to.be.rejectedWith('Keychain removal failed')
      })
    })

    describe('with netrc mode', function () {
      beforeEach(function () {
        stub(AccountsModule, 'getStorageConfig').returns({credentialStore: null, useNetrc: true})
      })

      it('should remove alias file', async function () {
        const alias = 'netrc-account'
        existsSyncStub.returns(false)

        await AccountsModule.remove(alias)

        expect(unlinkStub.calledOnce).to.be.true
        expect(unlinkStub.firstCall.args[0]).to.match(/netrc-account$/)
      })
    })
  })
})
