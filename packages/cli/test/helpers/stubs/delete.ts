import * as nock from 'nock'

export function collaboratorsteamApp(app: string, email: string) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .delete(`/teams/apps/${app}/collaborators/${email}`).reply(200, {})
}

export function collaboratorsPersonalApp(app: string, email: string) {
  return nock('https://api.heroku.com:443', {})
    .delete(`/apps/${app}/collaborators/${email}`).reply(200, {})
}

export function collaboratorsPersonalAppDeleteFailure(app: string, email: string) {
  return nock('https://api.heroku.com:443', {})
    .delete(`/apps/${app}/collaborators/${email}`).reply(404, {})
}

export function teamInvite(email = 'foo@email.com') {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.team-invitations'},
  })
    .delete(`/teams/myteam/invitations/${email}`).reply(200, {})
}

export function memberFromTeam() {
  return nock('https://api.heroku.com:443', {})
    .delete('/teams/myteam/members/foo%40foo.com').reply(200)
}
