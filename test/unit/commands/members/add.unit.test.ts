import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import MembersAdd from '../../../../src/commands/members/add.js'

type FakePlatform = {
  teamMember: {addOrInvite: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {teamMember: {addOrInvite: sinon.stub()}}
}

describe('heroku members:add', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('adds a member and returns the SDK member result', async function () {
    const member = {email: 'foo@foo.com', role: 'admin'}
    fakePlatform.teamMember.addOrInvite.callsFake(async (_team, _email, _role, {beforeMutation}) => {
      await beforeMutation({kind: 'member'})
      return {kind: 'member', member}
    })

    const {error, result, stderr, stdout} = await runCommand(MembersAdd, ['--team', 'myteam', '--role', 'admin', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.deep.equal({kind: 'member', member})
    expect(stderr).to.equal('Adding foo@foo.com to myteam as admin... done\n')
    expect(stdout).to.equal('')
    expect(fakePlatform.teamMember.addOrInvite.calledOnce).to.equal(true)
    expect(fakePlatform.teamMember.addOrInvite.firstCall.args.slice(0, 3)).to.eql(['myteam', 'foo@foo.com', 'admin'])
    expect(fakePlatform.teamMember.addOrInvite.firstCall.args[3]).to.have.property('beforeMutation').that.is.a('function')
  })

  it('starts the spinner from the callback with the invitation message and returns the invitation result', async function () {
    const invitation = {id: 'invite-id'}
    const start = sinon.spy(ux.action, 'start')
    const stop = sinon.spy(ux.action, 'stop')
    fakePlatform.teamMember.addOrInvite.callsFake(async (_team, _email, _role, {beforeMutation}) => {
      expect(start.called).to.equal(false)
      await beforeMutation({kind: 'invitation'})
      return {invitation, kind: 'invitation'}
    })

    const {error, result, stderr} = await runCommand(MembersAdd, ['--role=admin', '--team=myteam', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.deep.equal({invitation, kind: 'invitation'})
    expect(start.calledOnce).to.equal(true)
    expect(ansis.strip(start.firstCall.args[0])).to.equal('Inviting foo@foo.com to myteam as admin')
    expect(stderr).to.equal('Inviting foo@foo.com to myteam as admin... done\n')
    sinon.assert.callOrder(fakePlatform.teamMember.addOrInvite, start, stop)
  })

  it('passes arbitrary role strings through for API validation', async function () {
    const sdkResult = {kind: 'member', member: {email: 'foo@foo.com', role: 'custom-role'}}
    fakePlatform.teamMember.addOrInvite.callsFake(async (_team, _email, _role, {beforeMutation}) => {
      await beforeMutation({kind: 'member'})
      return sdkResult
    })

    const {error, result} = await runCommand(MembersAdd, ['--team=myteam', '--role=custom-role', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.equal(sdkResult)
    expect(fakePlatform.teamMember.addOrInvite.firstCall.args.slice(0, 3)).to.eql(['myteam', 'foo@foo.com', 'custom-role'])
    expect(fakePlatform.teamMember.addOrInvite.firstCall.args[3]).to.have.property('beforeMutation')
  })

  it('returns an undefined SDK mutation payload unchanged', async function () {
    fakePlatform.teamMember.addOrInvite.callsFake(async (_team, _email, _role, {beforeMutation}) => {
      await beforeMutation({kind: 'member'})
    })

    const {error, result} = await runCommand(MembersAdd, ['--team=myteam', '--role=admin', 'foo@foo.com'])

    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('does not start or stop the spinner when the SDK fails before the mutation callback', async function () {
    const failure = new Error('team info failed')
    const start = sinon.stub(ux.action, 'start')
    const stop = sinon.stub(ux.action, 'stop')
    fakePlatform.teamMember.addOrInvite.rejects(failure)

    const {error, stderr, stdout} = await runCommand(MembersAdd, ['--team=myteam', '--role=admin', 'foo@foo.com'])

    expect(error).to.equal(failure)
    expect(start.called).to.equal(false)
    expect(stop.called).to.equal(false)
    expect(stderr).to.equal('')
    expect(stdout).to.equal('')
  })

  it('does not stop the spinner or replace a mutation failure', async function () {
    const failure = new Error('member mutation failed')
    const start = sinon.stub(ux.action, 'start')
    const stop = sinon.stub(ux.action, 'stop')
    fakePlatform.teamMember.addOrInvite.callsFake(async (_team, _email, _role, {beforeMutation}) => {
      await beforeMutation({kind: 'member'})
      throw failure
    })

    const {error, stderr, stdout} = await runCommand(MembersAdd, ['--team=myteam', '--role=admin', 'foo@foo.com'])

    expect(error).to.equal(failure)
    expect(start.calledOnce).to.equal(true)
    expect(stop.called).to.equal(false)
    expect(stderr).to.not.contain('... done')
    expect(stdout).to.equal('')
  })
})
