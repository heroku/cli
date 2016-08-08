'use strict'

/* globals describe context it */

const Context = require('../lib/context')
const assert = require('assert')

describe('context', () => {
  describe('arguments', () => {
    context('expecting 1 required argument', () => {
      let command = { args: [{name: 'myarg'}] }

      it('parses 1 arg', () => {
        let argv = ['foo']
        let ctx = new Context({command, argv})
        assert.strictEqual(ctx.args.myarg, 'foo')
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
        assert.strictEqual(ctx.args.one, 'foo')
        assert.strictEqual(ctx.args.two, 'bar')
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
        assert.strictEqual(ctx.args.one, 'foo')
      })
    })

    context('with 1 required and 1 "not required" arg', () => {
      let command = { args: [{name: 'one'}, {name: 'two', required: false}] }

      it('ignores "not required" arg', () => {
        let argv = ['foo']
        let ctx = new Context({command, argv})
        assert.strictEqual(ctx.args.one, 'foo')
      })
    })
  })

  describe('flags', () => {
    context('with 1 flag', () => {
      let command = { flags: [{name: 'wait', char: 'w'}] }

      it('sets the flag', () => {
        let argv = ['--wait']
        let ctx = new Context({command, argv})
        assert.equal(ctx.flags.wait, true)
      })

      it('sets the short flag', () => {
        let argv = ['-w']
        let ctx = new Context({command, argv})
        assert.equal(ctx.flags.wait, true)
      })
    })

    context('with 1 flag that has a value', () => {
      let command = { flags: [{name: 'app', char: 'a', hasValue: true}] }

      it('sets the flag', () => {
        let argv = ['--app', 'myapp']
        let ctx = new Context({command, argv})
        assert.equal(ctx.flags.app, 'myapp')
      })

      it('sets the short flag', () => {
        let argv = ['-a', 'myapp']
        let ctx = new Context({command, argv})
        assert.equal(ctx.flags.app, 'myapp')
      })

      it('sets the short flag', () => {
        let argv = ['-amyapp']
        let ctx = new Context({command, argv})
        assert.equal(ctx.flags.app, 'myapp')
      })
    })

    context('with 2 flags', () => {
      let command = {
        flags: [
          {name: 'app', char: 'a', hasValue: true},
          {name: 'wait', char: 'w'}
        ]
      }

      it('sets both flags', () => {
        let argv = ['--app', 'myapp', '--wait']
        let ctx = new Context({command, argv})
        assert.strictEqual(ctx.flags.app, 'myapp')
        assert.strictEqual(ctx.flags.app, 'myapp')
      })

      it('sets both short flags', () => {
        let argv = ['-a', 'myapp', '-w']
        let ctx = new Context({command, argv})
        assert.strictEqual(ctx.flags.app, 'myapp')
        assert.strictEqual(ctx.flags.wait, 1)
      })

      it('sets both short flags', () => {
        let argv = ['-wamyapp']
        let ctx = new Context({command, argv})
        assert.strictEqual(ctx.flags.app, 'myapp')
        assert.strictEqual(ctx.flags.wait, 1)
      })
    })

    describe('debug', () => {
      let command = {}

      it('sets debug level to 1', () => {
        let argv = ['-d']
        let ctx = new Context({command, argv})
        assert.equal(ctx.flags.debug, 1)
      })

      it('sets debug level to 2', () => {
        let argv = ['-dd']
        let ctx = new Context({command, argv})
        assert.equal(ctx.flags.debug, 2)
      })
    })
  })
})
