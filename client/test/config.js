'use strict'

/* globals describe it beforeEach afterEach */

const config = require('../lib/config')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const path = require('path')
const json = require('../lib/json')

describe('config', () => {
  let configBase = 'tmp'
  let configFile = path.join(configBase, 'heroku', 'config.json')

  beforeEach(() => {
    try { fs.unlinkSync(configFile) } catch (err) { }
    process.env.XDG_CONFIG_HOME = path.join(configBase)
    config._read()
  })

  afterEach(() => {
    try { fs.unlinkSync(configFile) } catch (err) { }
    delete process.env.XDG_CONFIG_HOME
  })

  it('writes out config', () => {
    config.testing_foobar = 'test123'
    json.readJSON(configFile).should.have.property('testing_foobar', 'test123')
  })

  it('writes out defaults', () => {
    config.color.should.eq(true)
  })
})
