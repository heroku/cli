'use strict'

const {expect} = require('chai')
const time = require('../../src/time')
const now = new Date()

describe('time', () => {
  it('shows time ago', () => {
    expect(time.ago(new Date(0))).to.equal('1970/01/01 00:00:00 +0000')
    expect(time.ago(now), 'to end with', '(~ 0s ago)')
    expect(time.ago(new Date(now.getTime() - (24 * 60 * 60 * 1000))), 'to end with', '(~ 24h ago)')
  })

  it('shows time remaining', () => {
    expect(time.remaining(new Date(now.getTime() - (24 * 60 * 60 * 1000)), now)).to.equal('24h 0m')
    expect(time.remaining(new Date(now.getTime() - (60 * 1000)), now)).to.equal('1m 0s')
    expect(time.remaining(new Date(now.getTime() - (1000)), now)).to.equal('1s')
    expect(time.remaining(now, now)).to.equal('')
  })
})
