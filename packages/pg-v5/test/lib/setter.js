'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const db = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}
const fetcher = () => {
  return {
    addon: () => db,
  }
}

const setter = proxyquire('../../lib/setter', {
  './fetcher': fetcher,
})

describe('setter', () => {
  describe('generate', () => {
    let api
    let pg

    beforeEach(() => {
      api = nock('https://api.heroku.com:443')
      pg = nock('https://postgres-api.heroku.com')
      cli.mockConsole()
    })

    afterEach(() => {
      nock.cleanAll()
      api.done()
      pg.done()
    })

    let settings = [
      ['log_statement', 'none', setter.enum],
      ['log_lock_wait', 'on', setter.boolean],
      ['log_min_duration', 2000, setter.numeric],
      ['auto_explain', 'on', setter.boolean],
      ['auto_explain.log_analyze', 'on', setter.boolean],
      ['auto_explain.log_buffers', 'on', setter.boolean],
      ['auto_explain.log_min_duration', 200, setter.numeric],
      ['auto_explain.log_nested_statements', 'on', setter.boolean],
      ['auto_explain.log_triggers', 'on', setter.boolean],
      ['auto_explain.log_verbose', 'on', setter.boolean],
    ]
    settings.forEach(([name, value, convert]) => {
      let fn = setter.generate(name, convert, () => '')

      it(`shows the current value for ${name}`, () => {
        pg.get('/postgres/v0/databases/1/config').reply(200,
          {[name]: {value: value}})
        return cli.command(fn)({app: 'myapp', args: {}, flags: {}})
          .then(() => expect(cli.stdout).to.equal(`${name.replace(/_/g, '-')} is set to ${value} for postgres-1.\n\n`))
      })

      it(`change the value for ${name}`, () => {
        pg.patch('/postgres/v0/databases/1/config').reply(200,
          {[name]: {value: value}})
        return cli.command(fn)({app: 'myapp', args: {value: value}, flags: {}})
          .then(() => expect(cli.stdout).to.equal(`${name.replace(/_/g, '-')} has been set to ${value} for postgres-1.\n\n`))
      })
    })
  })

  describe('boolean', () => {
    it('returns true if on or true', () => {
      expect(setter.boolean('on')).to.equal(true)
      expect(setter.boolean('ON')).to.equal(true)
      expect(setter.boolean('true')).to.equal(true)
    })

    it('returns false if off, false or null', () => {
      expect(setter.boolean('OFF')).to.equal(false)
      expect(setter.boolean('off')).to.equal(false)
      expect(setter.boolean('false')).to.equal(false)
      expect(setter.boolean(null)).to.equal(false)
    })

    it('raise error if not recognized', () => {
      expect(() => setter.boolean('notok')).to.throw(TypeError)
      expect(() => setter.boolean('maybe')).to.throw(TypeError)
    })
  })

  describe('numeric', () => {
    it('returns a numeric value for number', () => {
      expect(setter.numeric('10')).to.equal(10)
      expect(setter.numeric('1')).to.equal(1)
    })

    it('raise error if not a number', () => {
      expect(() => setter.numeric('not a number')).to.throw(TypeError)
      expect(() => setter.numeric('NaN')).to.throw(TypeError)
      expect(() => setter.numeric('Infinite')).to.throw(TypeError)
    })
  })

  describe('enum', () => {
    it('returns the given value', () => {
      expect(setter.enum('value')).to.equal('value')
    })
  })
})
