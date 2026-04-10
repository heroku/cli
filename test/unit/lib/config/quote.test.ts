import {expect} from 'chai'

import {parse, quote} from '../../../../src/lib/config/quote.js'

describe('quote', function () {
  for (const [a, b] of [
    ['abc', 'abc'],
    ['ab$c', "'ab$c'"],
    ['a\'bc', '"a\'bc"'],
    ['a\nb\nc', String.raw`"a\nb\nc"`],
    [String.raw`foo\nb:ar\bz`, String.raw`'foo\\nb:ar\\bz'`],
  ]) {
    it(`${a}===${b}`, function () {
      expect(quote(a)).to.eq(b)
    })
  }

  for (const s of [
    'abc',
    'ab$c',
    'a\'bc',
    'a\nb\nc',
    String.raw`foo\nb:ar\bz`,
  ]) {
    it(`parses "${s}"`, function () {
      expect(parse(quote(s))).to.eq(s)
    })
  }
})

describe('parse', function () {
  it('parses double-quoted strings with newlines', function () {
    expect(parse('"hello\\nworld"')).to.eq('hello\nworld')
  })

  it('parses double-quoted strings with escaped characters', function () {
    expect(parse('"hello\\"world"')).to.eq('hello"world')
  })

  it('parses single-quoted strings with backslashes', function () {
    expect(parse("'hello\\\\world'")).to.eq('hello\\world')
  })

  it('parses empty strings', function () {
    expect(parse('')).to.eq('')
  })

  it('parses simple unquoted strings', function () {
    expect(parse('hello')).to.eq('hello')
  })

  it('throws error for multiple tokens', function () {
    expect(() => parse('hello world')).to.throw('Invalid token: hello world')
  })

  it('throws error for operator tokens', function () {
    expect(() => parse('&&')).to.throw('Invalid token: &&')
  })
})
