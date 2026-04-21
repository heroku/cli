import {expect} from 'chai'

import {parseAttachmentFactors} from '../../../../src/lib/data/parse-attachment-factors.js'

describe('parseAttachmentFactors', function () {
  it('returns an empty object when namespace is null', function () {
    expect(parseAttachmentFactors(null)).to.deep.equal({})
  })

  it('returns an empty object when namespace is undefined', function () {
    expect(parseAttachmentFactors()).to.deep.equal({})
  })

  it('returns an empty object when namespace is an empty string', function () {
    expect(parseAttachmentFactors('')).to.deep.equal({})
  })

  it('parses a full multi-factor namespace', function () {
    const result = parseAttachmentFactors('role:analyst|pool:analytics|proxy:false')

    expect(result).to.deep.equal({
      pool: 'analytics',
      proxy: false,
      role: 'analyst',
    })
  })

  it('parses a single role factor with only role on the result', function () {
    const result = parseAttachmentFactors('role:analyst')

    expect(result).to.deep.equal({role: 'analyst'})
    expect(result).to.not.have.property('pool')
    expect(result).to.not.have.property('proxy')
  })

  it('parses a single pool factor with only pool on the result', function () {
    const result = parseAttachmentFactors('pool:analytics')

    expect(result).to.deep.equal({pool: 'analytics'})
    expect(result).to.not.have.property('role')
    expect(result).to.not.have.property('proxy')
  })

  it('skips a factor when the colon delimiter is missing (no value)', function () {
    const result = parseAttachmentFactors('role:analyst|proxy|pool:analytics')

    expect(result).to.deep.equal({
      pool: 'analytics',
      role: 'analyst',
    })
  })

  it('ignores factors whose key is not an admitted attachment factor', function () {
    const result = parseAttachmentFactors('role:analyst|foo:bar|pool:analytics')

    expect(result).to.deep.equal({
      pool: 'analytics',
      role: 'analyst',
    })
    expect(result).to.not.have.property('foo')
  })

  it('trims whitespace around factor keys and values', function () {
    const result = parseAttachmentFactors('  role  :  analyst  |  pool : analytics  |  proxy :  true  ')

    expect(result).to.deep.equal({
      pool: 'analytics',
      proxy: true,
      role: 'analyst',
    })
  })

  it('returns an empty object for a legacy credential-prefixed namespace', function () {
    const result = parseAttachmentFactors('credential:analyst')

    expect(result).to.deep.equal({})
    expect(result).to.not.have.property('credential')
  })

  it('uses the last occurrence when the same factor key appears more than once', function () {
    const result = parseAttachmentFactors('role:first|pool:leader|role:second')

    expect(result).to.deep.equal({
      pool: 'leader',
      role: 'second',
    })
  })

  it('splits only on the first colon so values may contain additional colons', function () {
    const result = parseAttachmentFactors('role:user:with:colons|proxy:false|pool:analytics')

    expect(result).to.deep.equal({
      pool: 'analytics',
      proxy: false,
      role: 'user:with:colons',
    })
  })
})
