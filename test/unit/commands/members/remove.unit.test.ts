import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import {expect} from 'chai'
import * as sinon from 'sinon'

import MembersRemove from '../../../../src/commands/members/remove.js'

type FakePlatform = {
  team: {info: sinon.SinonStub}
  teamFeature: {list: sinon.SinonStub}
  teamInvitation: {list: sinon.SinonStub; revoke: sinon.SinonStub}
  teamMember: {delete: sinon.SinonStub; list: sinon.SinonStub}
  withHeaders: sinon.SinonStub
}

function buildFakePlatform(): FakePlatform {
  const platform: FakePlatform = {
    team: {info: sinon.stub()},
    teamFeature: {list: sinon.stub()},
    teamInvitation: {list: sinon.stub(), revoke: sinon.stub()},
    teamMember: {delete: sinon.stub(), list: sinon.stub()},
    withHeaders: sinon.stub(),
  }
  platform.withHeaders.returns(platform)
  return platform
}

describe('heroku members:remove', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    fakePlatform.team.info.resolves({name: 'myteam', type: 'enterprise'})
    fakePlatform.teamFeature.list.resolves([])
    fakePlatform.teamInvitation.list.resolves([])
    fakePlatform.teamInvitation.revoke.resolves()
    fakePlatform.teamMember.delete.resolves()
  })

  afterEach(function () {
    sinon.restore()
  })

  it('removes a member from an enterprise team without checking features or invitations', async function () {
    const {error, result, stderr, stdout} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(stderr).to.equal('Removing foo@foo.com from myteam... done\n')
    expect(stdout).to.equal('')
    expect(fakePlatform.team.info.calledOnceWithExactly('myteam')).to.equal(true)
    expect(fakePlatform.teamFeature.list.called).to.equal(false)
    expect(fakePlatform.teamInvitation.list.called).to.equal(false)
    expect(fakePlatform.teamInvitation.revoke.called).to.equal(false)
    expect(fakePlatform.teamMember.delete.calledOnceWithExactly('myteam', 'foo@foo.com')).to.equal(true)
    expect(fakePlatform.teamMember.list.called).to.equal(false)
    sinon.assert.callOrder(fakePlatform.team.info, fakePlatform.teamMember.delete)
  })

  it('removes a member from a team when the invitation feature is disabled', async function () {
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    const start = sinon.spy(ux.action, 'start')
    const stop = sinon.spy(ux.action, 'stop')

    const {result, stderr} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(result).to.be.undefined
    expect(stderr).to.contain('Removing foo@foo.com from myteam')
    expect(fakePlatform.teamFeature.list.calledOnceWithExactly('myteam')).to.equal(true)
    expect(fakePlatform.teamInvitation.list.called).to.equal(false)
    expect(fakePlatform.teamInvitation.revoke.called).to.equal(false)
    expect(fakePlatform.teamMember.delete.calledOnceWithExactly('myteam', 'foo@foo.com')).to.equal(true)
    sinon.assert.callOrder(fakePlatform.team.info, fakePlatform.teamFeature.list, start, fakePlatform.teamMember.delete, stop)
  })

  it('returns the raw member deletion payload', async function () {
    const member = {email: 'foo@foo.com', role: 'admin'}
    fakePlatform.teamMember.delete.resolves(member)

    const {error, result} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.equal(member)
  })

  it('returns an undefined invitation revoke payload unchanged', async function () {
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    fakePlatform.teamFeature.list.resolves([{enabled: true, name: 'team-invite-acceptance'}])
    fakePlatform.teamInvitation.list.resolves([{user: {email: 'foo@foo.com'}}])
    fakePlatform.teamInvitation.revoke.resolves()

    const {error, result} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
    expect(fakePlatform.teamInvitation.revoke.calledOnceWithExactly('myteam', 'foo@foo.com')).to.equal(true)
  })

  it('removes a member when the invitation feature is present but disabled', async function () {
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    fakePlatform.teamFeature.list.resolves([{enabled: false, name: 'team-invite-acceptance'}])

    await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(fakePlatform.teamInvitation.list.called).to.equal(false)
    expect(fakePlatform.teamMember.delete.calledOnceWithExactly('myteam', 'foo@foo.com')).to.equal(true)
  })

  it('removes a member if feature list does not include invitation acceptance', async function () {
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    fakePlatform.teamFeature.list.resolves([{enabled: true, name: 'some-other-feature'}])

    await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(fakePlatform.teamInvitation.list.called).to.equal(false)
    expect(fakePlatform.teamMember.delete.calledOnceWithExactly('myteam', 'foo@foo.com')).to.equal(true)
  })

  it('revokes an exact matching invitation with the invitation Accept header', async function () {
    const invitation = {id: 'invite-id'}
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    fakePlatform.teamFeature.list.resolves([{enabled: true, name: 'team-invite-acceptance'}])
    fakePlatform.teamInvitation.list.resolves([{user: {email: 'foo@foo.com'}}])
    fakePlatform.teamInvitation.revoke.resolves(invitation)
    fakePlatform.withHeaders.withArgs({Accept: 'application/vnd.heroku+json; version=3.team-invitations'}).returns(fakePlatform)

    const {error, result, stderr, stdout} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.equal(invitation)
    expect(stderr).to.equal('Revoking invite for foo@foo.com in myteam... done\n')
    expect(stdout).to.equal('')
    expect(fakePlatform.withHeaders.calledTwice).to.equal(true)
    expect(fakePlatform.withHeaders.alwaysCalledWithExactly({Accept: 'application/vnd.heroku+json; version=3.team-invitations'})).to.equal(true)
    expect(fakePlatform.teamInvitation.list.calledOnceWithExactly('myteam')).to.equal(true)
    expect(fakePlatform.teamInvitation.revoke.calledOnceWithExactly('myteam', 'foo@foo.com')).to.equal(true)
    expect(fakePlatform.teamMember.delete.called).to.equal(false)
    expect(fakePlatform.teamMember.list.called).to.equal(false)
    sinon.assert.callOrder(
      fakePlatform.team.info,
      fakePlatform.teamFeature.list,
      fakePlatform.withHeaders,
      fakePlatform.teamInvitation.list,
      fakePlatform.withHeaders,
      fakePlatform.teamInvitation.revoke,
    )
  })

  it('falls back to member delete when only a case-different invite email matches', async function () {
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    fakePlatform.teamFeature.list.resolves([{enabled: true, name: 'team-invite-acceptance'}])
    fakePlatform.teamInvitation.list.resolves([{user: {email: 'Foo@foo.com'}}])

    await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(fakePlatform.teamInvitation.revoke.called).to.equal(false)
    expect(fakePlatform.teamMember.delete.calledOnceWithExactly('myteam', 'foo@foo.com')).to.equal(true)
  })

  it('does not make another request when team info fails', async function () {
    const failure = new Error('team info failed')
    fakePlatform.team.info.rejects(failure)
    const start = sinon.stub(ux.action, 'start')
    const stop = sinon.stub(ux.action, 'stop')

    const {error, result, stderr, stdout} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.equal(failure)
    expect(result).to.be.undefined
    expect(fakePlatform.teamFeature.list.called).to.equal(false)
    expect(fakePlatform.teamInvitation.list.called).to.equal(false)
    expect(fakePlatform.teamInvitation.revoke.called).to.equal(false)
    expect(fakePlatform.teamMember.delete.called).to.equal(false)
    expect(start.called).to.equal(false)
    expect(stop.called).to.equal(false)
    expect(stderr).to.equal('')
    expect(stdout).to.equal('')
  })

  it('does not list invitations or mutate when feature lookup fails', async function () {
    const failure = new Error('feature lookup failed')
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    fakePlatform.teamFeature.list.rejects(failure)

    const {error} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.equal(failure)
    expect(fakePlatform.teamInvitation.list.called).to.equal(false)
    expect(fakePlatform.teamInvitation.revoke.called).to.equal(false)
    expect(fakePlatform.teamMember.delete.called).to.equal(false)
  })

  it('does not mutate when invitation listing fails', async function () {
    const failure = new Error('invitation list failed')
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    fakePlatform.teamFeature.list.resolves([{enabled: true, name: 'team-invite-acceptance'}])
    fakePlatform.teamInvitation.list.rejects(failure)

    const {error} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.equal(failure)
    expect(fakePlatform.teamInvitation.revoke.called).to.equal(false)
    expect(fakePlatform.teamMember.delete.called).to.equal(false)
  })

  it('does not stop the spinner or replace a member delete failure', async function () {
    const failure = new Error('member delete failed')
    fakePlatform.teamMember.delete.rejects(failure)
    const stop = sinon.stub(ux.action, 'stop')

    const {error, stderr, stdout} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.equal(failure)
    expect(fakePlatform.teamMember.delete.calledOnceWithExactly('myteam', 'foo@foo.com')).to.equal(true)
    expect(stop.called).to.equal(false)
    expect(stderr).to.not.contain('... done')
    expect(stdout).to.equal('')
  })

  it('does not stop the spinner or replace an invitation revoke failure', async function () {
    const failure = new Error('invitation revoke failed')
    fakePlatform.team.info.resolves({name: 'myteam', type: 'team'})
    fakePlatform.teamFeature.list.resolves([{enabled: true, name: 'team-invite-acceptance'}])
    fakePlatform.teamInvitation.list.resolves([{user: {email: 'foo@foo.com'}}])
    fakePlatform.teamInvitation.revoke.rejects(failure)
    const stop = sinon.stub(ux.action, 'stop')

    const {error, stderr, stdout} = await runCommand(MembersRemove, ['--team=myteam', 'foo@foo.com'])

    expect(error).to.equal(failure)
    expect(fakePlatform.teamMember.delete.called).to.equal(false)
    expect(stop.called).to.equal(false)
    expect(stderr).to.not.contain('... done')
    expect(stdout).to.equal('')
  })
})
