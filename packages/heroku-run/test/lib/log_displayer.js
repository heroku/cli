'use strict'
/* globals describe it */

const logDisplayer = require('../../lib/log_displayer')

describe('logDisplayer.COLORS', () => {
  it('has all the colors', () => {
    for (let c of logDisplayer.COLORS) c('foo')
  })
})
