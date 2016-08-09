'use strict'

/* globals describe context it afterEach */

const Context = require('../lib/context')

describe('context', () => {
  describe('arguments', () => {
    context('expecting 1 required argument', () => {
      let command = { args: [{name: 'myarg'}] }

      it('parses 1 arg', () => {
        return new Context(command).parse('foo')
        .then(ctx => ctx.args.myarg.should.eq('foo'))
      })

      it('fails if too many args', () => {
        return new Context(command).parse('foo', 'bar')
        .should.be.rejectedWith(/Unexpected argument bar/)
      })
    })

    context('expecting 2 required arguments', () => {
      let command = { args: [{name: 'one'}, {name: 'two'}] }

      it('parses 2 args', () => {
        return new Context(command).parse('foo', 'bar')
        .should.eventually.have.property('args').that.deep.equals({one: 'foo', two: 'bar'})
      })

      it('fails if argument missing', () => {
        return new Context(command).parse('foo')
        .should.be.rejectedWith(/Missing required argument two/)
      })
    })

    context('with 1 required and 1 optional arg', () => {
      let command = { args: [{name: 'one'}, {name: 'two', optional: true}] }

      it('ignores optional arg', () => {
        return new Context(command).parse('foo')
        .should.eventually.have.deep.property('args.one', 'foo')
      })
    })

    context('with 1 required and 1 "not required" arg', () => {
      let command = { args: [{name: 'one'}, {name: 'two', required: false}] }

      it('ignores "not required" arg', () => {
        return new Context(command).parse('foo')
        .should.eventually.have.deep.property('args.one', 'foo')
      })
    })
  })

  describe('flags', () => {
    context('with 1 flag', () => {
      let command = { flags: [{name: 'wait', char: 'w'}] }

      it('sets the flag', () => {
        return new Context(command).parse('--wait')
        .should.eventually.have.deep.property('flags.wait', 1)
      })

      it('sets the short flag', () => {
        return new Context(command).parse('-w')
        .should.eventually.have.deep.property('flags.wait', 1)
      })
    })

    context('with 1 flag that has a value', () => {
      let command = { flags: [{name: 'app', char: 'a', hasValue: true}] }

      it('sets the flag', () => {
        return new Context(command).parse('--app', 'myapp')
        .should.eventually.have.deep.property('flags.app', 'myapp')
      })

      it('sets the short flag', () => {
        return new Context(command).parse('-a', 'myapp')
        .should.eventually.have.deep.property('flags.app', 'myapp')
      })

      it('sets the short flag', () => {
        return new Context(command).parse('-amyapp')
        .should.eventually.have.deep.property('flags.app', 'myapp')
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
        return new Context(command).parse('--app', 'myapp', '--wait')
        .should.eventually.have.property('flags').that.deep.eq({app: 'myapp', wait: 1})
      })

      it('sets both short flags', () => {
        return new Context(command).parse('-a', 'myapp', '-w')
        .should.eventually.have.property('flags').that.deep.eq({app: 'myapp', wait: 1})
      })

      it('sets both short flags', () => {
        return new Context(command).parse('-wamyapp')
        .should.eventually.have.property('flags').that.deep.eq({app: 'myapp', wait: 1})
      })
    })

    describe('with required flag', () => {
      it('fails if flag is required', () => {
        let command = {flags: [{name: 'app', char: 'a', hasValue: true, required: true}]}
        return new Context(command).parse()
        .should.eventually.be.rejectedWith(/Missing required flag --app/)
      })

      it('fails if flag is not optional', () => {
        let command = {flags: [{name: 'app', char: 'a', hasValue: true, optional: false}]}
        return new Context(command).parse()
        .should.eventually.be.rejectedWith(/Missing required flag --app/)
      })
    })

    describe('debug', () => {
      let command = {}

      it('sets debug level to 0', () => {
        return new Context(command).parse()
        .should.eventually.have.property('debug', 0)
      })

      it('sets debug level to 1', () => {
        return new Context(command).parse('-d')
        .should.eventually.have.property('debug', 1)
      })

      it('sets debug level to 2', () => {
        return new Context(command).parse('-dd')
        .should.eventually.have.property('debug', 2)
      })
    })

    describe('supportsColor', () => {
      it('does not support color', () => {
        return new Context({}).parse()
        .should.eventually.have.property('supportsColor', true)
      })
    })

    describe('needsOrg', () => {
      let command = {needsOrg: true}

      afterEach(() => delete process.env.HEROKU_ORGANIZATION)

      it('fetches the org from HEROKU_ORGANIZATION', () => {
        process.env.HEROKU_ORGANIZATION = 'jeff-org'
        return new Context(command).parse()
        .should.eventually.have.property('org', 'jeff-org')
      })
    })

    describe('needsApp', () => {
      let command = {needsApp: true}

      afterEach(() => delete process.env.HEROKU_APP)

      it('fetches the app from HEROKU_APP', () => {
        process.env.HEROKU_APP = 'myapp'
        return new Context(command).parse()
        .should.eventually.have.property('app', 'myapp')
      })
    })

    describe('variableArgs', () => {
      let command = {variableArgs: true}

      it('loads variable args', () => {
        return new Context(command).parse('foo', 'bar', 'baz')
        .should.eventually.have.property('args').that.deep.eq(['foo', 'bar', 'baz'])
      })
    })
  })
})
