'use strict'
/* globals describe it */

let expect = require('unexpected')
let util = require('../../lib/util')
let fs = require('mz/fs')

describe('util', () => {
  describe('mkdirp', () => {
    it('creates a new directory', () => {
      let dir = './tmp/mynewdir'
      return fs.exists(dir)
        .then((exists) => exists ? fs.rmdir(dir) : null)
        .then(() => util.mkdirp(dir))
        .then(() => fs.exists(dir))
        .then((exists) => expect(exists, 'to be', true))
    })
  })
})
