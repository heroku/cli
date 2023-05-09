'use strict'

let expect = require('chai').expect

function stripIndents(str) {
  str = str.trim().replace(/\s+$/mg, '')

  let indent = (str.match(/^\s+[^$]/m) || [''])[0].length - 1
  let regexp = new RegExp(`^s{${indent}}`, 'mg')
  return str.replace(regexp, '')
}

module.exports = {
  expectOutput: function (actual, expected) {
    return expect(actual.trim().replace(/\s+$/mg, ''))
      .to.equal(stripIndents(expected))
  },
}
