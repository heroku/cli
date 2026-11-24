import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import MembersIndex from '../../../../src/commands/members/index.js'

type FakePlatform = {
  teamMember: {listWithInvitations: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {teamMember: {listWithInvitations: sinon.stub()}}
}

const adminMember = {email: 'admin@heroku.com', role: 'admin', status: ''}
const collaboratorMember = {email: 'collab@heroku.com', role: 'collaborator', status: ''}
const memberMember = {email: 'member@heroku.com', role: 'member', status: ''}
const pendingInvite = {email: 'invited-user@mail.com', role: 'admin', status: 'pending'}

describe('heroku members', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, collaboratorMember])
  })

  afterEach(function () {
    sinon.restore()
  })

  it('lists the SDK rows and returns the same rows', async function () {
    const {error, result, stderr, stdout} = await runCommand(MembersIndex, ['--team=myteam'])

    expect(error).to.be.undefined
    expect(result).to.eql([adminMember, collaboratorMember])
    expect(stdout).to.contain('admin@heroku.com')
    expect(stdout).to.contain('collab@heroku.com')
    expect(stderr).to.equal('')
    expect(fakePlatform.teamMember.listWithInvitations.calledOnceWithExactly('myteam')).to.equal(true)
  })

  it('lists active members and pending invitations together by default', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, pendingInvite])

    const {result, stdout} = await runCommand(MembersIndex, ['--team=myteam'])

    expect(result).to.eql([adminMember, pendingInvite])
    expect(stdout).to.contain('admin@heroku.com')
    expect(stdout).to.contain('invited-user@mail.com')
    expect(stdout).to.contain('pending')
  })

  it('preserves the empty-list message', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([])

    const {result, stdout} = await runCommand(MembersIndex, ['--team=myteam'])

    expect(result).to.eql([])
    expect(stdout).to.equal('No members in myteam\n')
  })

  it('filters returned rows by role', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, memberMember])

    const {result, stdout} = await runCommand(MembersIndex, ['--team=myteam', '--role=member'])

    expect(result).to.eql([memberMember])
    expect(stdout).to.contain('member@heroku.com')
    expect(stdout).to.contain('member')
    expect(stdout).to.not.contain('admin@heroku.com')
    expect(fakePlatform.teamMember.listWithInvitations.calledOnceWithExactly('myteam')).to.equal(true)
  })

  it('includes requested arbitrary role strings in filters and empty output', async function () {
    const {result, stdout} = await runCommand(MembersIndex, ['--team=myteam', '--role=custom-role'])

    expect(result).to.eql([])
    expect(stdout).to.equal('No members in myteam with role custom-role\n')
  })

  it('filters pending invitations after reading the combined list', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, pendingInvite])

    const {result, stdout} = await runCommand(MembersIndex, ['--team=myteam', '--pending'])

    expect(result).to.eql([pendingInvite])
    expect(stdout).to.contain('invited-user@mail.com')
    expect(stdout).to.contain('pending')
    expect(stdout).to.not.contain('admin@heroku.com')
    expect(fakePlatform.teamMember.listWithInvitations.calledOnceWithExactly('myteam')).to.equal(true)
  })

  it('applies role and pending filters together', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, pendingInvite, {...pendingInvite, email: 'other@mail.com', role: 'member'}])

    const {result, stdout} = await runCommand(MembersIndex, ['--team=myteam', '--role=admin', '--pending'])

    expect(result).to.eql([pendingInvite])
    expect(stdout).to.contain('invited-user@mail.com')
    expect(stdout).to.not.contain('other@mail.com')
  })

  it('preserves three-space JSON formatting and returns filtered rows', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, pendingInvite])
    const expected = [pendingInvite]

    const {result, stderr, stdout} = await runCommand(MembersIndex, ['--team=myteam', '--json', '--pending'])

    expect(result).to.eql(expected)
    expect(stdout).to.equal(`${JSON.stringify(expected, null, 3)}\n`)
    expect(stderr).to.equal('')
  })

  it('keeps the status table column based on invitations before filters', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, collaboratorMember, pendingInvite])

    const {stdout} = await runCommand(MembersIndex, ['--team=myteam', '--role=collaborator'])

    expect(stdout.toLowerCase()).to.contain('status')
    expect(stdout).to.contain('collab@heroku.com')
    expect(stdout).to.not.contain('invited-user@mail.com')
  })

  it('omits the status column when the combined list has no pending invitations', async function () {
    const {stdout} = await runCommand(MembersIndex, ['--team=myteam'])

    expect(stdout).to.not.contain('Status')
  })

  it('keeps pending invitations in the result for --pending', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, pendingInvite])

    const {result, stdout} = await runCommand(MembersIndex, ['--team=myteam', '--pending'])

    expect(result).to.eql([pendingInvite])
    expect(stdout).to.contain('pending')
  })

  it('keeps pending invitations out of the table when a role filter excludes them', async function () {
    fakePlatform.teamMember.listWithInvitations.resolves([adminMember, pendingInvite])

    const {result, stdout} = await runCommand(MembersIndex, ['--team=myteam', '--role=collaborator'])

    expect(result).to.eql([])
    expect(stdout).to.equal('No members in myteam with role collaborator\n')
  })

  it('passes through a generic list failure', async function () {
    const failure = new Error('team member list failed')
    fakePlatform.teamMember.listWithInvitations.rejects(failure)

    const {error, stderr, stdout} = await runCommand(MembersIndex, ['--team=myteam'])

    expect(error).to.equal(failure)
    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })
})
