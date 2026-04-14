import {expect} from 'chai'

import parseKeyValue from '../../../../src/lib/utils/key-value-parser.js'

describe('parseKeyValue', function () {
  it('parses a simple key=value pair', function () {
    const result = parseKeyValue('status=active')
    expect(result.key).to.equal('status')
    expect(result.value).to.equal('active')
  })

  it('trims whitespace from key and value', function () {
    const result = parseKeyValue('  status = active  ')
    expect(result.key).to.equal('status')
    expect(result.value).to.equal('active')
  })

  it('preserves value content after the first = sign', function () {
    const result = parseKeyValue('url=https://example.com/foo=bar')
    expect(result.key).to.equal('url')
    expect(result.value).to.equal('https://example.com/foo=bar')
  })

  it('returns empty string for value when no = is present', function () {
    const result = parseKeyValue('key')
    expect(result.key).to.equal('key')
    expect(result.value).to.equal('')
  })

  it('returns the full input as key with empty value when input ends with =', function () {
    const result = parseKeyValue('key=')
    expect(result.key).to.equal('key=')
    expect(result.value).to.equal('')
  })
})
