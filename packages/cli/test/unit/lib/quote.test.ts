import {expect} from 'chai'

import {parse, quote} from '../../../src/lib/config/quote'

describe('quote', () => {
  [
    ['abc', 'abc'],
    ['ab$c', "'ab$c'"],
    ['a\'bc', '"a\'bc"'],
    ['a\nb\nc', '"a\\nb\\nc"'],
    ['foo\\nb:ar\\bz', "'foo\\\\nb:ar\\\\bz'"],
  ].forEach(([a, b]) => {
    it(`${a}===${b}`, () => {
      expect(quote(a)).to.eq(b)
    })
  });

  [
    'abc',
    'ab$c',
    'a\'bc',
    'a\nb\nc',
    'foo\\nb:ar\\bz',
  ].forEach(s => {
    it(`parses "${s}"`, () => {
      expect(parse(quote(s))).to.eq(s)
    })
  })
})
