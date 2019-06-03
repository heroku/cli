let cmd = require('../../../commands/orgs/open')
const expect = require('chai').expect

describe('heroku org:open', () => {
  it('is is configured for an optional team/org flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })
})
