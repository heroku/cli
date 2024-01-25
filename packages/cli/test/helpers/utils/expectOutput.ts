import {expect} from 'chai'

function stripIndents(str: string) {
  str = str.trim().replace(/\s+$/mg, '')

  const indent = (str.match(/^\s+[^$]/m) || [''])[0].length - 1
  const regexp = new RegExp(`^s{${indent}}`, 'mg')
  return str.replace(regexp, '')
}

const expectOutput = function (actual: string, expected: string) {
  // it can be helpful to strip all hyphens & spaces when migrating tests before perfecting
  // use `.replace(/[\s─]/g, '')` on both actual & expected
  return expect(actual.trim().replace(/\s+$/mg, ''))
    .to.equal(stripIndents(expected))
}

export default expectOutput
