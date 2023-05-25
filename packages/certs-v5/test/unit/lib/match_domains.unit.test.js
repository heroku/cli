'use strict'
const expect = require('chai').expect
const matchDomains = require('../../../lib/match_domains')

describe('matchDomains', () => {
  it('matches a single domain', () => {
    const certDomains = ['www.foobar.com']
    const appDomains = ['www.foobar.com']

    expect(matchDomains(certDomains, appDomains)).to.deep.eq(['www.foobar.com'])
  })

  it('matches app domains with wildcard certs', () => {
    const certDomains = ['*.purple.com']
    const appDomains = ['www.foobar.com', 'www.purple.com', 'app.purple.com']

    expect(matchDomains(certDomains, appDomains)).to.deep.eq(['www.purple.com', 'app.purple.com'])
  })

  it('matches app domains with multiple wildcard certs', () => {
    const certDomains = ['*.purple.com', '*.foobar.com']
    const appDomains = ['www.foobar.com', 'www.purple.com', 'app.purple.com']

    expect(matchDomains(certDomains, appDomains)).to.deep.eq(['www.foobar.com', 'www.purple.com', 'app.purple.com'])
  })

  it('matches app domains with SAN certs', () => {
    const certDomains = ['www.purple.com', 'www.foobar.com']
    const appDomains = ['www.foobar.com', 'www.purple.com', 'app.purple.com']

    expect(matchDomains(certDomains, appDomains)).to.deep.eq(['www.purple.com', 'www.foobar.com'])
  })

  it('matches wildcards at the correct depth', () => {
    const certDomains = ['*.purple.com']
    const appDomains = ['foo.purple.com', 'foo.bar.purple.com']

    expect(matchDomains(certDomains, appDomains)).to.deep.equal(['foo.purple.com'])
  })

  it('returns a blank array when nothing matches', () => {
    const certDomains = ['www.foobar.com']
    const appDomains = ['www.purple.com']

    expect(matchDomains(certDomains, appDomains)).to.deep.eq([])
  })
})
