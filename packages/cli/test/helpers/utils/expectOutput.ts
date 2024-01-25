import {expect} from 'chai'

function stripIndents(str: string) {
  str = str.trim().replace(/\s+$/mg, '')

  const indent = (str.match(/^\s+[^$]/m) || [''])[0].length - 1
  const regexp = new RegExp(`^s{${indent}}`, 'mg')
  return str.replace(regexp, '')
}

const expectOutput = function (actual: string, expected: string) {
  return expect(actual.trim().replace(/\s+$/mg, '').replace(/[\s─]/g, ''))
    .to.equal(stripIndents(expected).replace(/[\s─]/g, ''))
}

export default expectOutput
