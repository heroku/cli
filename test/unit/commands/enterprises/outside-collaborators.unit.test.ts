import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import OutsideCollaborators from '../../../../src/commands/enterprises/outside-collaborators.js'

describe('heroku enterprises:outside-collaborators', function () {
  const collaborator = {
    app: {id: 'a1', name: 'some-app'},
    created_at: '2026-06-01T00:00:00Z',
    id: 'c1',
    updated_at: '2026-06-01T00:00:00Z',
    user: {email: 'outsider@example.com', federated: false, id: 'u1'},
  }
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('lists outside collaborators in a table', async function () {
    api
      .get('/enterprise-accounts/my-ea/outside-collaborators')
      .reply(200, [collaborator])

    const {stdout} = await runCommand(OutsideCollaborators, ['--enterprise-account', 'my-ea'])

    expect(stdout).to.contain('outsider@example.com')
    expect(stdout).to.contain('some-app')
  })

  it('outputs json with --json', async function () {
    api
      .get('/enterprise-accounts/my-ea/outside-collaborators')
      .reply(200, [collaborator])

    const {stdout} = await runCommand(OutsideCollaborators, ['--enterprise-account', 'my-ea', '--json'])

    expect(JSON.parse(stdout)).to.deep.equal([collaborator])
  })

  it('--json is a raw passthrough of the API response (preserves order, unsorted)', async function () {
    // Returned in non-email order: zoe before alice. --json must NOT reorder.
    const zoe = {...collaborator, id: 'c2', user: {email: 'zoe@example.com', federated: false, id: 'u2'}}
    const alice = {...collaborator, id: 'c3', user: {email: 'alice@example.com', federated: true, id: 'u3'}}
    api
      .get('/enterprise-accounts/my-ea/outside-collaborators')
      .reply(200, [zoe, alice])

    const {stdout} = await runCommand(OutsideCollaborators, ['--enterprise-account', 'my-ea', '--json'])

    expect(JSON.parse(stdout)).to.deep.equal([zoe, alice])
  })

  it('shows an empty message when there are none', async function () {
    api
      .get('/enterprise-accounts/my-ea/outside-collaborators')
      .reply(200, [])

    const {stdout} = await runCommand(OutsideCollaborators, ['--enterprise-account', 'my-ea'])

    expect(stdout).to.contain('No outside collaborators in my-ea')
  })
})
