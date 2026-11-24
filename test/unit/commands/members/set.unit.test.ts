import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import * as sinon from 'sinon'

import MembersSet from '../../../../src/commands/members/set.js'

type FakePlatform = {
  teamFeature: {list: sinon.SinonStub}
  teamMember: {update: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {teamFeature: {list: sinon.stub()}, teamMember: {update: sinon.stub()}}
}

describe('heroku members:set', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('updates a member role and returns the raw SDK payload', async function () {
    const member = {email: 'foo@foo.com', role: 'admin'}
    fakePlatform.teamMember.update.resolves(member)
    const start = sinon.spy(ux.action, 'start')
    const stop = sinon.spy(ux.action, 'stop')

    const {error, result, stderr, stdout} = await runCommand(MembersSet, ['--role=admin', '--team=myteam', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.equal(member)
    expect(stderr).to.equal('Adding foo@foo.com to myteam as admin... done\n')
    expect(stdout).to.equal('')
    expect(fakePlatform.teamMember.update.calledOnceWithExactly('myteam', {email: 'foo@foo.com', role: 'admin'})).to.equal(true)
    sinon.assert.callOrder(start, fakePlatform.teamMember.update, stop)
  })

  it('preserves arbitrary role strings for API validation', async function () {
    fakePlatform.teamMember.update.resolves({email: 'foo@foo.com', role: 'custom-role'})

    const {error} = await runCommand(MembersSet, ['--team=myteam', '--role=custom-role', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(fakePlatform.teamMember.update.calledOnce).to.equal(true)
    expect(fakePlatform.teamMember.update.firstCall.args).to.eql(['myteam', {email: 'foo@foo.com', role: 'custom-role'}])
  })

  it('returns an undefined SDK result unchanged without looking up invitation features', async function () {
    fakePlatform.teamMember.update.resolves()

    const {error, result} = await runCommand(MembersSet, ['--role=member', '--team=myteam', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(fakePlatform.teamMember.update.calledOnceWithExactly('myteam', {email: 'foo@foo.com', role: 'member'})).to.equal(true)
    expect(fakePlatform.teamFeature.list.called).to.equal(false)
  })

  it('passes through a mutation failure without stopping the spinner', async function () {
    const failure = new Error('member update failed')
    fakePlatform.teamMember.update.rejects(failure)
    const stop = sinon.stub(ux.action, 'stop')

    const {error, stderr, stdout} = await runCommand(MembersSet, ['--role=admin', '--team=myteam', 'foo@foo.com'])

    expect(error).to.equal(failure)
    expect(fakePlatform.teamMember.update.calledOnceWithExactly('myteam', {email: 'foo@foo.com', role: 'admin'})).to.equal(true)
    expect(stop.called).to.equal(false)
    expect(stderr).to.not.contain('... done')
    expect(stdout).to.equal('')
  })
})
