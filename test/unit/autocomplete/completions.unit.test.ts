import {expect} from 'chai'

import {accountCacheKey, completionClientOptions, hostCacheKey} from '../../../src/lib/autocomplete/completions.js'

describe('autocomplete completionClientOptions', function () {
  it('opts out of the default warn sink so a TAB never prints to stderr', function () {
    // spread last over sdkOptions/apiClientOptions, so warn: undefined wins and
    // the default oclif warn never fires mid-completion
    expect(completionClientOptions()).to.have.property('warn', undefined)
  })

  it('keeps the shell-safety guarantees (short timeout, non-prompting 2FA)', async function () {
    const opts = completionClientOptions()
    expect(opts.timeout).to.be.a('number').and.to.be.greaterThan(0)
    await expect(opts.twoFactor?.onChallenge?.()).to.be.rejected
  })

  it('opts out of reauthorize so an expired token never drives a login prompt mid-completion', function () {
    // spread last over sdkOptions/apiClientOptions, so reauthorize: undefined
    // wins and a 401 during a TAB surfaces quietly instead of prompting for login
    expect(completionClientOptions()).to.have.property('reauthorize', undefined)
  })
})

describe('autocomplete completions cache keys', function () {
  describe('accountCacheKey (per-account resources)', function () {
    it('scopes the key by API host', function () {
      const prod = accountCacheKey('app', 'api.heroku.com', 'tok')
      const staging = accountCacheKey('app', 'api.staging.herokudev.com', 'tok')
      expect(prod).to.not.equal(staging)
      expect(prod).to.contain('api.heroku.com')
    })

    it('scopes the key by account (different tokens never collide)', function () {
      const a = accountCacheKey('app', 'api.heroku.com', 'token-a')
      const b = accountCacheKey('app', 'api.heroku.com', 'token-b')
      expect(a).to.not.equal(b)
    })

    it('scopes the key by completion kind (apps and teams never collide)', function () {
      const apps = accountCacheKey('app', 'api.heroku.com', 'tok')
      const teams = accountCacheKey('team', 'api.heroku.com', 'tok')
      expect(apps).to.not.equal(teams)
    })

    it('is stable for the same kind+host+token', function () {
      expect(accountCacheKey('app', 'api.heroku.com', 'tok')).to.equal(accountCacheKey('app', 'api.heroku.com', 'tok'))
    })

    it('never embeds the raw token', function () {
      const token = 'super-secret-token'
      expect(accountCacheKey('app', 'api.heroku.com', token)).to.not.contain(token)
    })

    it('uses an anon scope when there is no token', function () {
      const noToken: string | undefined = undefined
      const anon = accountCacheKey('app', 'api.heroku.com', noToken)
      expect(anon).to.contain('anon')
      expect(anon).to.not.equal(accountCacheKey('app', 'api.heroku.com', 'tok'))
    })
  })

  describe('hostCacheKey (host-global resources)', function () {
    it('scopes by host but not by account, so every account shares one list', function () {
      expect(hostCacheKey('region', 'api.heroku.com')).to.equal(hostCacheKey('region', 'api.heroku.com'))
      expect(hostCacheKey('region', 'api.heroku.com')).to.not.equal(hostCacheKey('region', 'api.staging.herokudev.com'))
    })

    it('scopes by completion kind (regions and stacks never collide)', function () {
      expect(hostCacheKey('region', 'api.heroku.com')).to.not.equal(hostCacheKey('stack', 'api.heroku.com'))
    })

    it('carries no account/token component', function () {
      expect(hostCacheKey('region', 'api.heroku.com')).to.not.contain('#')
    })
  })
})
