import {expect, test} from '@oclif/test'

import {buildCommand} from '../../src/lib/helpers'

describe('helpers.buildCommand()', () => {
  [
    {args: ['echo foo'], expected: 'echo foo'},
    {args: ['echo', 'foo bar'], expected: 'echo "foo bar"'},
    {args: ['echo', 'foo', 'bar'], expected: 'echo foo bar'},
    {args: ['echo', '{"foo": "bar"}'], expected: 'echo "{\\"foo\\": \\"bar\\"}"'},
    {args: ['echo', '{"foo":"bar"}'], expected: 'echo "{\\"foo\\":\\"bar\\"}"'},
  ].forEach(example => {
    test
    .it(`parses \`${example.args.join(' ')}\` as ${example.expected}`, () => {
      expect(buildCommand(example.args)).to.equal(example.expected)
    })
  })
})
