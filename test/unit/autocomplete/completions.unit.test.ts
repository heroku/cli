import {expect} from 'chai'

import {appCacheKey} from '../../../src/lib/autocomplete/completions.js'

describe('autocomplete completions cache key', function () {
  it('scopes the key by API host', function () {
    const prod = appCacheKey('api.heroku.com', 'tok')
    const staging = appCacheKey('api.staging.herokudev.com', 'tok')
    expect(prod).to.not.equal(staging)
    expect(prod).to.contain('api.heroku.com')
  })

  it('scopes the key by account (different tokens never collide)', function () {
    const a = appCacheKey('api.heroku.com', 'token-a')
    const b = appCacheKey('api.heroku.com', 'token-b')
    expect(a).to.not.equal(b)
  })

  it('is stable for the same host+token', function () {
    expect(appCacheKey('api.heroku.com', 'tok')).to.equal(appCacheKey('api.heroku.com', 'tok'))
  })

  it('never embeds the raw token', function () {
    const token = 'super-secret-token'
    expect(appCacheKey('api.heroku.com', token)).to.not.contain(token)
  })

  it('uses an anon scope when there is no token', function () {
    const noToken: string | undefined = undefined
    const anon = appCacheKey('api.heroku.com', noToken)
    expect(anon).to.contain('anon')
    expect(anon).to.not.equal(appCacheKey('api.heroku.com', 'tok'))
  })
})
