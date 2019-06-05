const cmd = require('../../../commands/orgs/open')
const expect = require('chai').expect

describe('heroku org:open', () => {
  it('is configured for an optional team flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })
})
