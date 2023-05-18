'use strict'
/* globals before after */

const helpers = require('../../../lib/helpers')
const {expect} = require('chai')
const sinon = require('sinon')
const Dyno = require('../../../lib/dyno')
let dynoStartStub

describe('helpers.buildCommand()', () => {
  [
    {args: ['echo foo'], expected: 'echo foo'},
    {args: ['echo', 'foo bar'], expected: 'echo "foo bar"'},
    {args: ['echo', 'foo', 'bar'], expected: 'echo foo bar'},
    {args: ['echo', '{"foo": "bar"}'], expected: 'echo "{\\"foo\\": \\"bar\\"}"'},
    {args: ['echo', '{"foo":"bar"}'], expected: 'echo "{\\"foo\\":\\"bar\\"}"'},
  ].forEach(example => {
    it(`parses \`${example.args.join(' ')}\` as ${example.expected}`, () => {
      expect(helpers.buildCommand(example.args)).to.equal(example.expected)
    })
  })

  describe('dyno function testing', async () => {
    const opts = {
      attach: false,
      showStatus: false,
      dyno: false,
    }
    before(() => {
      dynoStartStub = sinon.stub(Dyno.prototype, '_doStart').callsFake(() => {
        return Promise.resolve()
      })
    })

    it('returns the started dyno', async () => {
      let dyno = new Dyno(opts)
      await dyno.start()
      expect(dynoStartStub.calledOnce).to.equal(true)
    })

    after(() => {
      dynoStartStub.restore()
    })
  })
})
