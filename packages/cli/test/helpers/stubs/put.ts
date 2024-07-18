import * as nock from 'nock'

export function sendInvite(email = 'raulb@heroku.com', role = 'admin') {
  return nock('https://api.heroku.com:443')
    .put('/teams/myteam/invitations', {email, role})
    .reply(200)
}

export function updateMemberRole(email = 'raulb@heroku.com', role = 'admin') {
  return nock('https://api.heroku.com:443')
    .put('/teams/myteam/members', {email, role})
    .reply(200)
}
