let cli = require('heroku-cli-util')
const sinon = require('sinon')
const expect = require('chai').expect
let stubGet = require('../../stub/get')
const proxyquire = require('proxyquire')
let cmd
let apiGetOrgInfo

describe('heroku org:open', () => {
  beforeEach(() => {
    apiGetOrgInfo = stubGet.teamInfo()
    openStub = sinon.stub(cli, 'open').callsFake(() => {})
    cmd = proxyquire('../../../commands/orgs/open', {
      'cli': openStub
    })
    cli.mockConsole()
  })

  afterEach(() => {
    openStub.restore()
    nock.cleanAll()
  })

  it('is configured for an optional team flag', function () {
    expect(cmd).to.have.own.property('wantsOrg', true)
  })

  it('shows an error if team flag is not passed', function () {
    cmd.run({}).catch((err) => {
      expect(err).to.be.instanceOf(Error)
    })
  })

  it('opens org in dashboard via browser if team flag is passed', function () {
    return cmd.run({ flags: { team: 'myteam' } })
    .then(() => apiGetOrgInfo.done())
    .then(() => expect(openStub.called).to.equal(true))
  })
})
