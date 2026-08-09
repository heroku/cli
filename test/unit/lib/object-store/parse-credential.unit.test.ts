import {expect} from 'chai'

import {parseCredential} from '../../../../src/lib/object-store/parse-credential.js'

describe('parseCredential', function () {
  it('returns undefined for a nullish namespace (default credential)', function () {
    expect(parseCredential(null)).to.equal(undefined)
    expect(parseCredential()).to.equal(undefined)
    expect(parseCredential('')).to.equal(undefined)
  })

  it('extracts the credential name from a credential namespace', function () {
    expect(parseCredential('credential:reports')).to.equal('reports')
  })

  it('returns undefined for a namespace that is not a credential', function () {
    expect(parseCredential('role:analyst')).to.equal(undefined)
    expect(parseCredential('pool:leader')).to.equal(undefined)
  })

  it('keeps additional colons in the credential name', function () {
    expect(parseCredential('credential:team:reports')).to.equal('team:reports')
  })
})
