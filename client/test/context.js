'use strict'

/* globals describe context it */

const Context = require('../lib/context')
const assert = require('assert')

describe('context', () => {
  context('expecting 1 required argument', () => {
    let command = { args: [{name: 'myarg'}] }

    it('parses 1 arg', () => {
      let argv = ['foo']
      let ctx = new Context({command, argv})
      assert.equal(ctx.args.myarg, 'foo')
    })

    it('fails if too many args', () => {
      let argv = ['foo', 'bar']
      assert.throws(() => new Context({argv, command}), /Unexpected argument bar/)
    })
  })

  context('expecting 2 required arguments', () => {
    let command = { args: [{name: 'one'}, {name: 'two'}] }

    it('parses 2 args', () => {
      let argv = ['foo', 'bar']
      let ctx = new Context({command, argv})
      assert.equal(ctx.args.one, 'foo')
      assert.equal(ctx.args.two, 'bar')
    })

    it('fails if argument missing', () => {
      let argv = ['foo']
      assert.throws(() => new Context({argv, command}), /Missing argument two/)
    })
  })

  context('with 1 required and 1 optional arg', () => {
    let command = { args: [{name: 'one'}, {name: 'two', optional: true}] }

    it('ignores optional arg', () => {
      let argv = ['foo']
      let ctx = new Context({command, argv})
      assert.equal(ctx.args.one, 'foo')
    })
  })

  context('with 1 required and 1 "not required" arg', () => {
    let command = { args: [{name: 'one'}, {name: 'two', required: false}] }

    it('ignores "not required" arg', () => {
      let argv = ['foo']
      let ctx = new Context({command, argv})
      assert.equal(ctx.args.one, 'foo')
    })
  })
})
