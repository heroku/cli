import {expect} from 'chai'

import {parseProvisionOpts} from '../../../../src/lib/data/parseProvisionOpts.js'

describe('parseProvisionOpts', function () {
  it('parses simple key:value pairs', function () {
    const result = parseProvisionOpts(['fork:DATABASE', 'foo:true'])
    expect(result).to.deep.equal({
      foo: 'true',
      fork: 'DATABASE',
    })
  })

  it('defaults empty values to "true" when colon is present', function () {
    const result = parseProvisionOpts(['rollback:'])
    expect(result).to.deep.equal({
      rollback: 'true',
    })
  })

  it('defaults to "true" when colon is not present', function () {
    const result = parseProvisionOpts(['rollback'])
    expect(result).to.deep.equal({
      rollback: 'true',
    })
  })

  it('splits on first colon only, allowing colons in values', function () {
    const result = parseProvisionOpts(['key:value:with:colons', 'timestamp:2025-11-17T15:20:00'])
    expect(result).to.deep.equal({
      key: 'value:with:colons',
      timestamp: '2025-11-17T15:20:00',
    })
  })

  it('trims whitespace from keys and values', function () {
    const result = parseProvisionOpts(['  key  :  value  ', '  foo:bar  '])
    expect(result).to.deep.equal({
      foo: 'bar',
      key: 'value',
    })
  })

  it('handles keys without colons', function () {
    const result = parseProvisionOpts(['rollback', 'foo'])
    expect(result).to.deep.equal({
      foo: 'true',
      rollback: 'true',
    })
  })

  it('handles multiple provision options with mixed formats', function () {
    const result = parseProvisionOpts([
      'fork:DATABASE',
      'rollback:true',
      'follow:otherdb',
      'foo:',
      'bar',
    ])
    expect(result).to.deep.equal({
      bar: 'true',
      follow: 'otherdb',
      foo: 'true',
      fork: 'DATABASE',
      rollback: 'true',
    })
  })

  it('handles empty array', function () {
    const result = parseProvisionOpts([])
    expect(result).to.deep.equal({})
  })
})

