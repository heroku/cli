'use strict'
/* globals describe it */

const helpers = require('../../lib/helpers')
const { expect } = require('chai')

describe('helpers.buildCommand()', () => {
  [
    { args: ['echo foo'], expected: 'echo foo' },
    { args: ['echo', 'foo bar'], expected: 'echo "foo bar"' },
    { args: ['echo', 'foo', 'bar'], expected: 'echo foo bar' },
    { args: ['echo', '{"foo": "bar"}'], expected: 'echo "{\\"foo\\": \\"bar\\"}"' },
    { args: ['echo', '{"foo":"bar"}'], expected: 'echo "{\\"foo\\":\\"bar\\"}"' }
  ].forEach(example => {
    it(`parses \`${example.args.join(' ')}\` as ${example.expected}`, () => {
      expect(helpers.buildCommand(example.args)).to.equal(example.expected)
    })
  })
})
