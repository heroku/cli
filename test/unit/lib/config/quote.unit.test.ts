import {expect} from 'chai'

import {parse, quote} from '../../../../src/lib/config/quote.js'

describe('quote', function () {
  for (const [a, b] of [
    ['abc', 'abc'],
    ['ab$c', "'ab$c'"],
    ['a\'bc', '"a\'bc"'],
    ['a\nb\nc', String.raw`"a\nb\nc"`],
    [String.raw`foo\nb:ar\bz`, String.raw`'foo\nb:ar\bz'`],
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
    JSON.stringify({private_key: '-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----\n', type: 'service_account'}, null, 2),
    'line1\n' + String.raw`a\nb`,
    'line1\n' + String.raw`a\\nb`,
    'line1\n' + String.raw`C:\new\temp`,
    'line1\n' + String.raw`"$` + '`' + String.raw`!\ y`,
    'line1\ny\\',
  ]) {
    it(`parses "${s}"`, function () {
      expect(parse(quote(s))).to.eq(s)
    })
  }
})

describe('parse', function () {
  it('reads back any mix of the characters quote escapes as it was', function () {
    const characters = ['a', 'n', ' ', '\n', '\\', '"', "'", '$', '`', '!', '#', '{', '}', '=']
    let seed = 1
    const random = (n: number) => {
      seed = (seed * 48_271) % 2_147_483_647
      return seed % n
    }

    for (let i = 0; i < 5000; i++) {
      const s = Array.from({length: 1 + random(12)}, () => characters[random(characters.length)]).join('')
      expect(parse(quote(s)), JSON.stringify(s)).to.eq(s)
    }
  })

  it('parses double-quoted strings with newlines', function () {
    expect(parse(String.raw`"hello\nworld"`)).to.eq('hello\nworld')
  })

  it('parses double-quoted strings with escaped characters', function () {
    expect(parse(String.raw`"hello\"world"`)).to.eq('hello"world')
  })

  it('parses single-quoted strings with backslashes as they are', function () {
    expect(parse(String.raw`'hello\world'`)).to.eq(String.raw`hello\world`)
    expect(parse(String.raw`'hello\\world'`)).to.eq(String.raw`hello\\world`)
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
