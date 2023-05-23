'use strict'

const nock = require('nock')

function collaboratorsteamApp(app, email) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .delete(`/teams/apps/${app}/collaborators/${email}`).reply(200, {})
}

function collaboratorsPersonalApp(app, email) {
  return nock('https://api.heroku.com:443', {})
    .delete(`/apps/${app}/collaborators/${email}`).reply(200, {})
}

function collaboratorsPersonalAppDeleteFailure(app, email) {
  return nock('https://api.heroku.com:443', {})
    .delete(`/apps/${app}/collaborators/${email}`).reply(404, {})
}

function teamInvite(email = 'foo@email.com') {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.team-invitations'},
  })
    .delete(`/teams/myteam/invitations/${email}`).reply(200, {})
}

function memberFromTeam() {
  return nock('https://api.heroku.com:443', {})
    .delete('/teams/myteam/members/foo%40foo.com').reply(200)
}

module.exports = {
  collaboratorsteamApp,
  collaboratorsPersonalApp,
  collaboratorsPersonalAppDeleteFailure,
  memberFromTeam,
  teamInvite,
}
