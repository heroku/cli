import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('heroku members:remove', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  context('from an org', function () {
    it('removes a member from an org', async function () {
      api
        .get('/teams/myteam')
        .reply(200, {name: 'myteam', role: 'admin', type: 'enterprise'})
        .delete('/teams/myteam/members/foo%40foo.com')
        .reply(200)

      const {stderr} = await runCommand(['members:remove', '--team', 'myteam', 'foo@foo.com'])

      expect(stderr).to.contain('Removing foo@foo.com from myteam')
    })
  })

  context('from a team', function () {
    context('without the feature flag team-invite-acceptance', function () {
      it('removes a member from an org', async function () {
        api
          .get('/teams/myteam')
          .reply(200, {name: 'myteam', role: 'admin', type: 'team'})
          .get('/teams/myteam/features')
          .reply(200, [])
          .delete('/teams/myteam/members/foo%40foo.com')
          .reply(200)

        const {stderr} = await runCommand(['members:remove', '--team', 'myteam', 'foo@foo.com'])

        expect(stderr).to.contain('Removing foo@foo.com from myteam')
      })
    })

    context('with the feature flag team-invite-acceptance', function () {
      context('with no pending invites', function () {
        it('removes a member', async function () {
          api
            .get('/teams/myteam')
            .reply(200, {name: 'myteam', role: 'admin', type: 'team'})
            .get('/teams/myteam/features')
            .reply(200, [{enabled: true, name: 'team-invite-acceptance'}])
            .get('/teams/myteam/invitations')
            .reply(200, [])
            .delete('/teams/myteam/members/foo%40foo.com')
            .reply(200)

          const {stderr} = await runCommand(['members:remove', '--team', 'myteam', 'foo@foo.com'])

          expect(stderr).to.contain('Removing foo@foo.com from myteam')
        })
      })

      context('with pending invites', function () {
        it('revokes the invite', async function () {
          api
            .get('/teams/myteam')
            .reply(200, {name: 'myteam', role: 'admin', type: 'team'})
            .get('/teams/myteam/features')
            .reply(200, [{enabled: true, name: 'team-invite-acceptance'}])
            .get('/teams/myteam/invitations')
            .reply(200, [{
              invited_by: {email: 'invite@foo.com'},
              role: 'member',
              user: {email: 'foo@foo.com'},
            }])
            .delete('/teams/myteam/invitations/foo@foo.com')
            .reply(200, {})

          const {stderr} = await runCommand(['members:remove', '--team', 'myteam', 'foo@foo.com'])

          expect(stderr).to.contain('Revoking invite for foo@foo.com in myteam')
        })
      })
    })
  })
})
